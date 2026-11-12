# Rediseño del Banco Científico

## Fase 1 · Auditoría y línea base

1. La suite es una aplicación estática de HTML, CSS y JavaScript sin compilación.
2. El registro en core.js contiene 339 herramientas y el renderizador de lab.js sirve 310 modelos. Las nueve fichas de conversión se resolvieron en el conversor central; sus rutas `unit-*` anteriores redirigen.
3. app.js administra rutas con fragmentos, navegación, montaje, favoritos, exportación y restablecimiento.
4. Las definiciones científicas mantienen fórmulas y límites en los módulos de assets/js/tools.
5. Las herramientas especializadas, el conversor, los mapas y la bioacústica tienen pantallas propias.
6. Los estados de entrada y preferencias usan almacenamiento local con claves existentes.
7. El motor Python atiende la bioacústica en el equipo y está separado del servidor estático.
8. El logo oficial tiene una variante transparente que se puede usar en los dos temas.
9. La suite estática entrega todos los scripts; una edición web de pago necesita servir los módulos privados desde un origen autenticado.
10. Este directorio no contiene metadatos Git. Las ramas y commits se pueden preparar cuando el proyecto esté en un repositorio.
11. La regresión toma una huella de entradas y salidas brutas de los 310 modelos por defecto, más tres escenarios explícitos de los pilotos.

Archivos de verificación: tests/result-regression.cjs y tests/fixtures/model-results.json. Ejecutar node tests/result-regression.cjs.

## Fase 2 · Piloto para revisión

- [MBR](http://127.0.0.1:8876/#/tool/mbr-process-membrane-sizing), aguas residuales y reúso, con Membranas y desalinización como acceso relacionado.
- [Escorrentía SCS](http://127.0.0.1:8876/#/tool/curve-number-runoff), hidráulica e hidrología.
- [AQI diario EPA](http://127.0.0.1:8876/#/tool/epa-air-quality-index), aire y emisiones.

Tema claro por defecto para visitas nuevas, con respeto de la preferencia guardada. La precisión automática usa cuatro cifras significativas y formato es-ES. Cada piloto usa el color de su categoría y permite fijar una referencia para ver la variación del resultado al editar el escenario. Las animaciones respetan la preferencia de movimiento reducido. El selector cambia solo la presentación, el informe y el CSV formateado. La acción «CSV de datos sin redondeo» conserva el formato original de datos para procesamiento. Las exportaciones formateadas incluyen versión, fecha UTC, entradas, métricas y detalle disponible. Los diálogos de informe y restablecimiento del piloto devuelven el foco al botón que los abrió.

Archivos del piloto: index.html, assets/css/calculator.css, assets/js/calculator-ui.js, assets/js/lab.js, assets/js/app.js y assets/js/core.js. Para verificar la experiencia en Chromium, ejecutar node tests/calculator-pilot.cjs con la configuración Playwright de la suite. node tests/lab-browser.cjs comprueba la navegación, exportaciones, persistencia y vistas móviles del catálogo.

## Fases siguientes

- Fase 3. Extender la plantilla tras la revisión del piloto. Adaptar las pantallas especiales de forma individual y repetir las pruebas de cada ruta.
- Fase 4. Preparar la portada pública, navegación de favoritos y recientes, búsqueda agrupada y tres rutas gratuitas indexables. Mostrar prueba, precios y cuenta cuando esos servicios estén disponibles.
- Fase 5. Separar el entorno local del despliegue público con cuenta. En la edición pública, usar Supabase Auth y PostgreSQL con RLS y un backend para sesión, acceso, entrega autenticada de módulos y pagos.
- Fase 6. Probar registro, confirmación, expiración, eventos duplicados o fuera de orden y reactivación en sandbox. Medir Lighthouse y revisar accesibilidad y seguridad sobre el despliegue real.

## Opciones de pago para Perú

| Proveedor | Características para evaluar |
| --- | --- |
| Paddle | Comerciante registrado (MoR), suscripciones y verificación de webhooks. Perú no figura entre países excluidos para proveedores. Confirmar moneda de cobro y liquidación con una cuenta aprobada. [Países](https://www.paddle.com/help/start/account-verification/which-countries-are-supported-by-paddle) · [Webhooks](https://developer.paddle.com/webhooks/signature-verification) |
| Lemon Squeezy | Alternativa MoR con suscripciones. Confirmar alta, método de liquidación para Perú y monedas en el proceso de aprobación. [Países y pagos](https://docs.lemonsqueezy.com/help/getting-started/supported-countries) |
| Culqi | Suscripciones para el mercado peruano. Revisar moneda, medios recurrentes, contrato y conciliación. [Suscripciones](https://docs.culqi.com/es/documentacion/pagos-online/recurrencia/suscripciones/resumen) |
| Mercado Pago | API de suscripciones, reintentos y eventos de pago recurrente. Verificar medios admitidos para cobros posteriores y condiciones de la cuenta peruana. [Suscripciones](https://www.mercadopago.com.pe/developers/es/docs/subscriptions/overview) · [Webhooks](https://www.mercadopago.com.pe/developers/es/docs/links-and-debts/additional-content/your-integrations/notifications/webhooks) |
| Niubiz | Opción local con servicio de pago programado. Solicitar las condiciones comerciales y la documentación de integración aplicable a suscripciones de la plataforma. [Pago programado](https://pago-programado.niubiz.com.pe/files/terminos-y-condiciones-suscripcion-pago-programado.pdf) |

Paddle es el primer candidato para un lanzamiento internacional si la cuenta supera el alta. Culqi y Mercado Pago quedan como candidatos para cobro local. La interfaz BillingProvider debe encapsular alta de checkout, portal y verificación de eventos. Los precios se resolverán en el servidor a partir de identificadores de plan configurados. [Supabase Auth](https://supabase.com/docs/guides/auth) · [RLS de PostgreSQL en Supabase](https://supabase.com/docs/guides/database/postgres/row-level-security)

En producción, la verificación del correo inicia una prueba de 72 horas con una operación transaccional e idempotente, usando la hora del servidor. El acceso se comprueba también al pedir un módulo privado. Los eventos firmados de facturación se registran y deduplican antes de actualizar la suscripción. Un navegador autorizado recibe el código necesario para ejecutar localmente y puede conservar una copia previa. Si se exige revocación fuerte de ese código después de su entrega, habría que cambiar el modelo de ejecución para depender del servidor.

La edición pública deberá declarar que los cálculos permanecen en el navegador y que cuenta y suscripción se procesan en el servidor. El análisis acústico se ejecuta en el motor local separado y el audio queda en el equipo. En esta fase la suite local no tiene cuentas, pagos ni una prueba comercial activa.
