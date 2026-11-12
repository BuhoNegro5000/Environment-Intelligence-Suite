/* Barrido de rutas con Chrome/Edge headless vía CDP, sin Playwright.
   Uso: node tests/routes-cdp.cjs [desde] [cantidad]
   Variables: CHROME (ruta del ejecutable), GREENOWL_TEST_URL (por defecto http://127.0.0.1:8876/),
   GREENOWL_CDP_PORT (por defecto 9334). */
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = Number(process.env.GREENOWL_CDP_PORT || 9334);
const BASE = process.env.GREENOWL_TEST_URL || 'http://127.0.0.1:8876/';
const userDir = path.join(os.tmpdir(), 'greenowl-cdp-' + Date.now());
fs.mkdirSync(userDir, { recursive: true });
const chrome = spawn(CHROME, [
  `--remote-debugging-port=${PORT}`, `--user-data-dir=${userDir}`,
  '--headless=new', '--disable-gpu', '--no-sandbox', '--no-first-run',
  '--disable-extensions', 'about:blank'
], { stdio: 'ignore' });

const sleep = ms => new Promise(r => setTimeout(r, ms));
async function waitVersion() {
  for (let i = 0; i < 80; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      if (r.ok) return r.json();
    } catch {}
    await sleep(250);
  }
  throw new Error('Chrome no respondió en el puerto de depuración ' + PORT);
}
async function newTab(url) {
  const r = await fetch(`http://127.0.0.1:${PORT}/json/new?${encodeURIComponent(url)}`, { method: 'PUT' });
  if (!r.ok) throw new Error('No se pudo abrir la pestaña: ' + r.status);
  return r.json();
}

class CDP {
  constructor(url) {
    this.ws = new WebSocket(url);
    this.seq = 0;
    this.pending = new Map();
    this.ws.onmessage = ev => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
      }
    };
  }
  ready() {
    return new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = () => reject(new Error('Error de WebSocket CDP'));
    });
  }
  send(method, params = {}) {
    const id = ++this.seq;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  close() { try { this.ws.close(); } catch {} }
}

(async () => {
  const failures = [];
  const startAt = Number(process.argv[2] || 0);
  const limit = Number(process.argv[3] || 0);
  let visited = 0;

  try {
    await waitVersion();
    const tab = await newTab(BASE);
    const cdp = new CDP(tab.webSocketDebuggerUrl);
    await cdp.ready();
    await cdp.send('Runtime.enable');
    await cdp.send('Page.enable');

    let errors = [];
    cdp.ws.addEventListener('message', ev => {
      const msg = JSON.parse(ev.data);
      if (msg.method === 'Runtime.exceptionThrown') errors.push(msg.params.exceptionDetails.text || 'exception');
      if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
        errors.push(msg.params.args.map(a => a.value || a.description || '').join(' '));
      }
    });

    async function evaluate(expression) {
      const r = await cdp.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
      if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + ' ' + (r.exceptionDetails.exception?.description || ''));
      return r.result.value;
    }
    async function waitFor(expression, timeout = 8000) {
      const end = Date.now() + timeout;
      while (Date.now() < end) {
        if (await evaluate(`Boolean(${expression})`)) return;
        await sleep(80);
      }
      throw new Error('Tiempo de espera agotado: ' + expression);
    }

    await waitFor(`window.GL && GL.tools.length > 300`);
    const ids = await evaluate(`GL.tools.map(t => t.id)`);
    const total = ids.length;
    const list = limit ? ids.slice(startAt, startAt + limit) : ids.slice(startAt);
    console.log(`Barrido de ${list.length} de ${total} rutas (desde ${startAt}).`);

    for (let i = 0; i < list.length; i++) {
      const id = list[i];
      errors = [];
      try {
        await evaluate(`location.hash = '#/tool/${id}'`);
        await waitFor(`document.querySelector('[data-tool="${id}"] #toolBody')`);
        await sleep(120);
        const info = await evaluate(`(() => {
          const art = document.querySelector('[data-tool="${id}"]');
          const body = art && art.querySelector('#toolBody');
          return {
            text: body ? body.textContent.trim().length : 0,
            html: body ? body.innerHTML.length : 0,
            overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth
          };
        })()`);
        if (!info.html) failures.push(id + ': cuerpo vacío');
        else if (info.overflow > 2) failures.push(id + ': desbordamiento horizontal ' + info.overflow + 'px');
        else if (errors.length) failures.push(id + ': consola ' + errors.slice(0, 2).join(' | '));
        visited++;
      } catch (e) {
        failures.push(id + ': ' + e.message);
      }
      if ((i + 1) % 25 === 0) console.log(`  ${i + 1}/${list.length} rutas…`);
    }

    console.log(`\nRutas visitadas: ${visited}/${list.length}`);

    // Verificación de las nueve fichas de conversión integradas en el conversor central.
    const legacy = {
      'unit-length': 'length', 'unit-area': 'area', 'unit-volume': 'volume',
      'unit-mass': 'mass', 'unit-density': 'density', 'unit-pressure': 'pressure',
      'unit-temperature': 'temperature', 'unit-flow': 'flow', 'unit-mass-flow': 'massFlow'
    };
    let conversions = 0;
    for (const [id, dimension] of Object.entries(legacy)) {
      errors = [];
      try {
        await evaluate(`location.replace(location.pathname + location.search + '#/tool/${id}')`);
        await waitFor(`document.querySelector('[data-tool="unit-converter"] #ucDimension')`);
        await sleep(150);
        const picked = await evaluate(`document.getElementById('ucDimension').value`);
        if (picked !== dimension) failures.push(id + ': magnitud ' + picked + ' en lugar de ' + dimension);
        else conversions++;
        if (errors.length) failures.push(id + ': consola ' + errors.slice(0, 2).join(' | '));
      } catch (e) {
        failures.push(id + ': ' + e.message);
      }
    }
    console.log(`Conversiones integradas verificadas: ${conversions}/9`);

    console.log(failures.length ? 'FALLOS (' + failures.length + '):\n- ' + failures.join('\n- ') : 'SIN FALLOS');
    await cdp.send('Browser.close').catch(() => {});
  } catch (e) {
    failures.push('ERROR GENERAL: ' + e.message);
    console.error(e.stack || e);
  } finally {
    try { chrome.kill(); } catch {}
    await sleep(300);
    try { fs.rmSync(userDir, { recursive: true, force: true }); } catch {}
    process.exit(failures.length ? 1 : 0);
  }
})();
