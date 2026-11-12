"""Prueba con el motor real en 8877 y fixture oficial BirdNET de 7,3 s."""
import json
import time
from pathlib import Path
import requests

ROOT = Path(__file__).resolve().parent.parent
API = 'http://127.0.0.1:8877'
ORIGIN = {'Origin': 'http://127.0.0.1:8876', 'Content-Type': 'application/octet-stream'}
for _ in range(40):
    state = requests.get(API + '/api/status', timeout=5).json()
    if state['ready']:
        break
    time.sleep(1)
assert state['ready'], state
audio = (ROOT / 'tests/fixtures/birdnet-soundscape-7s.flac').read_bytes()
response = requests.post(API + '/api/analyze?threshold=0.25&top_k=3', headers=ORIGIN, data=audio, timeout=30)
assert response.status_code == 202, response.text
job_id = response.json()['jobId']
for _ in range(120):
    result = requests.get(API + '/api/jobs/' + job_id, timeout=10).json()
    if result['state'] not in {'queued', 'running'}:
        break
    time.sleep(1)
assert result['state'] == 'complete', result
assert result['model'] == 'BirdNET V3.0 ONNX fp32'
assert result['detections'], 'El fixture debe producir detecciones con umbral 0,25.'
for row in result['detections']:
    assert 0 <= row['start_time'] < row['end_time'] <= result['duration'] + .001, row
    assert .25 <= row['confidence'] <= 1, row
    assert row['species_name'], row
denied = requests.post(API + '/api/analyze', headers={'Origin': 'https://example.com'}, data=audio[:16], timeout=5)
assert denied.status_code == 403
invalid = requests.post(API + '/api/analyze?threshold=2', headers=ORIGIN, data=b'bad', timeout=5)
assert invalid.status_code == 400
assert state['geoReady'], state
location = requests.post(API + '/api/analyze', params={'latitude': 42.5, 'longitude': -76.45,
                         'date': '2026-06-15', 'geo_threshold': .03, 'threshold': .25},
                         headers=ORIGIN, data=audio, timeout=30)
assert location.status_code == 202, location.text
for _ in range(120):
    geo_result = requests.get(API + '/api/jobs/' + location.json()['jobId'], timeout=10).json()
    if geo_result['state'] not in {'queued', 'running'}:
        break
    time.sleep(1)
assert geo_result['state'] == 'complete', geo_result
assert geo_result['geography']['period'] == 23 and geo_result['geography']['candidates'] > 0, geo_result
assert geo_result['detections'] and all(.03 <= d['geo_confidence'] <= 1 for d in geo_result['detections']), geo_result
(ROOT / 'artifacts/birdnet-real-inference.json').write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')
print('OK: BirdNET V3 real, %d detecciones; %d con filtro local de sitio y fecha; origen y parámetros validados.' %
      (len(result['detections']), len(geo_result['detections'])), flush=True)
