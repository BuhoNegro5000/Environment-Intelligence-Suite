# Motor científico local · BirdNET V3

La interfaz `#/tool/bioacoustics` se conecta exclusivamente al motor de este equipo en `127.0.0.1:8877`. El resto de la suite conserva su ejecución en navegador. El análisis de audio necesita el servicio Python local; no es inferencia dentro del navegador.

Ejecuta `iniciar-suite.ps1` desde la carpeta del proyecto. Inicia el servidor estático y el motor acústico sin ventanas adicionales. Después abre `http://127.0.0.1:8876/`. El script conserva los servicios que ya estén escuchando en esos puertos.

## Entorno y modelo

Entorno dedicado `.venv-science`, Python 3.13, paquete `birdnet==1.4.0`, ONNX Runtime y SoundFile. El modelo oficial acústico BirdNET V3.0 ONNX fp32 (aproximadamente 542 MB), las etiquetas y la taxonomía del motor se descargaron mediante `birdnet.load('acoustic', '3.0', 'onnx')`. El filtro por sitio y fecha utiliza el modelo oficial BirdNET Geo V3.0 ONNX fp32 de aproximadamente 15,5 MB.

El servicio establece `BIRDNET_OFFLINE=1` antes de cargar el modelo. Si falta un archivo del modelo, lo informa; no descarga material ni envía audio durante el análisis. La distribución de una copia del proyecto a otro equipo requiere preparar ese entorno y caché del modelo allí.

Para reconstruir el entorno: `python -m venv .venv-science`, después `.venv-science/Scripts/python.exe -m pip install birdnet==1.4.0`. La descarga inicial se realiza explícitamente con `birdnet.load('acoustic', '3.0', 'onnx')` y `birdnet.load('geo', '3.0', 'onnx')` antes de iniciar el servicio offline.

## Uso

Audio de 3 segundos a 30 minutos, hasta 100 MB. Ventanas de 3 segundos, umbral, top-k, banda de frecuencia y solapamiento configurables. La vista previa se decodifica en el navegador; la inferencia se realiza en CPU local. Se muestran intervalo, etiqueta, confianza y revisión humana. El CSV conserva todas las detecciones y decisiones; el JSON añade parámetros, hash SHA-256 del archivo y versión del modelo.

El filtro geográfico acepta latitud y longitud WGS84, umbral y fecha opcional. Con fecha se usa uno de los 48 períodos de BirdNET, cuatro por mes. Sin fecha se usa el máximo anual. Se cruza la lista geográfica con las etiquetas acústicas antes del top-k. El informe conserva ambas puntuaciones por separado y el JSON registra el período y el número de especies candidatas.

Los archivos del motor son temporales y se eliminan al finalizar, cancelar o fallar. El motor conserva hasta 50 resultados recientes en memoria, no grabaciones. Solo escucha en loopback, verifica Host y limita los orígenes admitidos a los servidores locales de la suite.

## Procedencia y condiciones

- Motor y documentación: https://github.com/birdnet-team/birdnet y https://birdnet-team.github.io/BirdNET-Analyzer/dev/installation.html
- Modelos y condiciones: https://birdnet-team.github.io/BirdNET-Analyzer/stable/models.html. Los modelos oficiales indicados por BirdNET usan CC BY-NC-SA 4.0; su instalación local no concede derechos de explotación comercial. El código de Green Owl y el modelo son componentes diferentes.
- Fixture de comprobación: `soundscape_7s.flac`, del repositorio oficial birdnet-team/birdnet, directorio src/birdnet_tests/TEST_FILES/audio_formats. Se usa como prueba de integración, no como grabación propia ni dato de campo.

Las puntuaciones son salidas de clasificación y requieren revisión humana. No son una prueba concluyente de presencia ni sustituyen validación acústica regional.
