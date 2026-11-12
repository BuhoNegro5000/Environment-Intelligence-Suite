"""Green Owl: motor acústico estrictamente local. Ejecutar con .venv-science.

BirdNET V3 y sus modelos conservan sus licencias: consultar docs/BIOACUSTICA.md.
No se sube audio a terceros. Los archivos temporales se eliminan tras el análisis.
"""
from concurrent.futures import ThreadPoolExecutor
from datetime import date
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse, parse_qs
import json
import os
import tempfile
import threading
import time
import uuid

ROOT = Path(__file__).resolve().parent
ALLOWED = {'http://127.0.0.1:8876', 'http://127.0.0.1:8877', 'http://localhost:8876', 'http://localhost:8877'}
JOBS = {}
LOCK = threading.Lock()
POOL = ThreadPoolExecutor(max_workers=1)
MODEL = None
MODEL_ERROR = None
GEO_MODEL = None
GEO_ERROR = None
READY = threading.Event()


def load_model():
    global MODEL, MODEL_ERROR, GEO_MODEL, GEO_ERROR
    try:
        # El modelo ya se descargó en la preparación; el servicio no usa red.
        os.environ['BIRDNET_OFFLINE'] = '1'
        import birdnet
        MODEL = birdnet.load('acoustic', '3.0', 'onnx')
    except Exception as exc:
        MODEL_ERROR = str(exc)
    if MODEL is not None:
        try:
            GEO_MODEL = birdnet.load('geo', '3.0', 'onnx')
        except Exception as exc:
            GEO_ERROR = str(exc)
    READY.set()


def geographic_candidates(latitude, longitude, recorded, threshold):
    # BirdNET define 48 períodos anuales, cuatro por mes.
    week = (recorded.month - 1) * 4 + min(4, (recorded.day - 1) // 7 + 1) if recorded else None
    predictions = GEO_MODEL.predict(latitude, longitude, week=week, min_confidence=threshold)
    ranges = {str(row['species_name']).split('_', 1)[0]: float(row['confidence'])
              for row in predictions.to_structured_array()}
    labels = [label for label in MODEL.species_list if label.split('_', 1)[0] in ranges]
    return labels, ranges, week


def run_job(job_id, filename, options, geography):
    job = JOBS[job_id]
    try:
        if job['cancel'].is_set():
            job.update(state='cancelled', finished=time.time())
            return
        job['state'] = 'running'
        ranges = {}
        if geography:
            labels, ranges, week = geographic_candidates(*geography)
            job['geography'] = {'model': 'BirdNET Geo V3.0 ONNX', 'period': week, 'candidates': len(labels)}
            if not labels:
                job.update(state='complete', detections=[], model='BirdNET V3.0 ONNX fp32', finished=time.time())
                return
            options['custom_species_list'] = labels
        def progress(stats):
            if job['cancel'].is_set():
                raise RuntimeError('Análisis cancelado por el usuario.')
        result = MODEL.predict(filename, n_workers=1, n_producers=1, batch_size=1,
                               device='CPU', show_stats='progress', progress_callback=progress,
                               **options)
        records = []
        for row in result.to_structured_array():
            record = {}
            for key in row.dtype.names:
                value = row[key]
                if key == 'input':
                    continue
                record[key] = value.item() if hasattr(value, 'item') else value
            if geography:
                record['geo_confidence'] = ranges[record['species_name'].split('_', 1)[0]]
            records.append(record)
        job.update(state='complete', detections=records, model='BirdNET V3.0 ONNX fp32', finished=time.time())
    except Exception as exc:
        job.update(state='cancelled' if job['cancel'].is_set() else 'error', error=str(exc), finished=time.time())
    finally:
        Path(filename).unlink(missing_ok=True)


class Handler(BaseHTTPRequestHandler):
    def end_headers(self):
        origin = self.headers.get('Origin')
        if origin in ALLOWED:
            self.send_header('Access-Control-Allow-Origin', origin)
            self.send_header('Vary', 'Origin')
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def respond(self, obj, code=200):
        body = json.dumps(obj, ensure_ascii=False, allow_nan=False).encode('utf-8')
        self.send_response(code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def allowed_host(self):
        return self.headers.get('Host') in {'127.0.0.1:8877', 'localhost:8877'}

    def do_OPTIONS(self):
        if not self.allowed_host() or self.headers.get('Origin') not in ALLOWED:
            return self.respond({'error': 'Origen no permitido.'}, 403)
        self.send_response(204)
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        if not self.allowed_host():
            return self.respond({'error': 'Host no permitido.'}, 403)
        route = urlparse(self.path).path
        if route == '/api/status':
            return self.respond({'ready': READY.is_set() and MODEL is not None,
                                 'geoReady': GEO_MODEL is not None, 'geoError': GEO_ERROR,
                                 'error': MODEL_ERROR, 'model': 'BirdNET V3.0 ONNX fp32',
                                 'processing': 'CPU local', 'externalAudioUploads': False})
        if route.startswith('/api/jobs/'):
            job = JOBS.get(route.rsplit('/', 1)[-1])
            if not job:
                return self.respond({'error': 'Trabajo no encontrado.'}, 404)
            return self.respond({k: v for k, v in job.items() if k != 'cancel'})
        return self.respond({'error': 'Ruta no encontrada.'}, 404)

    def do_POST(self):
        if not self.allowed_host() or self.headers.get('Origin') not in ALLOWED:
            return self.respond({'error': 'Origen no permitido.'}, 403)
        parsed = urlparse(self.path)
        if parsed.path.startswith('/api/cancel/'):
            job = JOBS.get(parsed.path.rsplit('/', 1)[-1])
            if not job:
                return self.respond({'error': 'Trabajo no encontrado.'}, 404)
            job['cancel'].set()
            return self.respond({'requested': True})
        if parsed.path != '/api/analyze':
            return self.respond({'error': 'Ruta no encontrada.'}, 404)
        if MODEL is None:
            return self.respond({'error': MODEL_ERROR or 'El motor todavía se está cargando.'}, 503)
        filename = None
        try:
            params = parse_qs(parsed.query)
            def number(name, default, low, high):
                value = float(params.get(name, [default])[0])
                if not low <= value <= high:
                    raise ValueError(name + ': fuera de rango.')
                return value
            confidence = number('threshold', .25, .001, 1)
            top_k = int(number('top_k', 5, 1, 20))
            overlap = number('overlap', 0, 0, 2.9)
            fmin = int(number('fmin', 0, 0, 14999))
            fmax = int(number('fmax', 15000, 1, 15000))
            geography = None
            if any(key in params for key in ('latitude', 'longitude', 'date', 'geo_threshold')):
                if GEO_MODEL is None:
                    return self.respond({'error': GEO_ERROR or 'El modelo geográfico no está disponible.'}, 503)
                if not {'latitude', 'longitude'} <= params.keys():
                    raise ValueError('Indica latitud y longitud para aplicar el filtro.')
                latitude = number('latitude', 0, -90, 90)
                longitude = number('longitude', 0, -180, 180)
                recorded = date.fromisoformat(params['date'][0]) if 'date' in params else None
                geography = (latitude, longitude, recorded, number('geo_threshold', .03, .001, 1))
            if fmin >= fmax:
                raise ValueError('Frecuencia mínima debe ser menor que la máxima.')
            size = int(self.headers.get('Content-Length', '0'))
            if not 0 < size <= 100_000_000:
                raise ValueError('Audio de 1 byte a 100 MB requerido.')
            with LOCK:
                busy = sum(j['state'] in {'queued', 'running'} for j in JOBS.values())
                if busy >= 3:
                    return self.respond({'error': 'Hay tres trabajos pendientes. Espera o cancela uno.'}, 429)
            import soundfile as sf
            with tempfile.NamedTemporaryFile(prefix='greenowl_audio_', suffix='.audio', delete=False) as f:
                filename = f.name
                remaining = size
                self.connection.settimeout(60)
                while remaining:
                    chunk = self.rfile.read(min(1024 * 1024, remaining))
                    if not chunk:
                        raise ValueError('Audio recibido incompleto.')
                    f.write(chunk)
                    remaining -= len(chunk)
            info = sf.info(filename)
            if info.duration < 3 or info.duration > 1800:
                raise ValueError('La grabación debe durar entre 3 segundos y 30 minutos.')
            # BirdNET valida la extensión además del contenido. Se deriva del
            # formato decodificado, nunca del nombre enviado por el navegador.
            suffix = {'WAV': '.wav', 'WAVEX': '.wav', 'RF64': '.wav', 'FLAC': '.flac',
                      'MPEG-1/2 AUDIO': '.mp3', 'MP3': '.mp3', 'OGG': '.ogg',
                      'AIFF': '.aiff'}.get(info.format)
            if suffix is None:
                raise ValueError('Formato no habilitado: ' + info.format + '. Usa WAV, FLAC, MP3, OGG o AIFF.')
            renamed = str(Path(filename).with_suffix(suffix))
            Path(filename).rename(renamed)
            filename = renamed
            job_id = uuid.uuid4().hex
            job = {'state': 'queued', 'created': time.time(), 'duration': info.duration,
                   'sampleRate': info.samplerate, 'channels': info.channels,
                   'threshold': confidence, 'cancel': threading.Event()}
            with LOCK:
                # Retiene solo 50 resultados recientes en memoria, nunca audios.
                completed = sorted((k for k, v in JOBS.items() if v['state'] not in {'queued', 'running'}),
                                   key=lambda k: JOBS[k]['created'])
                while len(JOBS) >= 50 and completed:
                    JOBS.pop(completed.pop(0), None)
                JOBS[job_id] = job
            POOL.submit(run_job, job_id, filename, dict(top_k=top_k, default_confidence_threshold=confidence,
                        overlap_duration_s=overlap, bandpass_fmin=fmin, bandpass_fmax=fmax), geography)
            filename = None
            return self.respond({'jobId': job_id, 'state': 'queued'}, 202)
        except Exception as exc:
            if filename:
                Path(filename).unlink(missing_ok=True)
            return self.respond({'error': str(exc)}, 400)

    def log_message(self, fmt, *args):
        # Nunca registra audio, nombres originales ni parámetros personales.
        pass


if __name__ == '__main__':
    threading.Thread(target=load_model, daemon=True).start()
    server = ThreadingHTTPServer(('127.0.0.1', 8877), Handler)
    print('Green Owl · motor local en http://127.0.0.1:8877', flush=True)
    server.serve_forever()
