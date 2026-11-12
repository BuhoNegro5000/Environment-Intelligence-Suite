$ErrorActionPreference = 'Stop'
$suiteRoot = $PSScriptRoot
$pythonEngine = Join-Path $suiteRoot '.venv-science\Scripts\python.exe'
if (-not (Test-Path -LiteralPath $pythonEngine)) {
    throw 'Falta el entorno científico local .venv-science. Consulta docs/BIOACUSTICA.md.'
}
foreach ($service in @(@{Port=8876; Args=@('-m','http.server','8876','--bind','127.0.0.1')}, @{Port=8877; Args=@('local_science_server.py')})) {
    $listening = Get-NetTCPConnection -LocalPort $service.Port -State Listen -ErrorAction SilentlyContinue
    if (-not $listening) {
        Start-Process -FilePath $pythonEngine -ArgumentList $service.Args -WorkingDirectory $suiteRoot -WindowStyle Hidden
    }
}
Write-Output 'Suite: http://127.0.0.1:8876/ · Motor acústico: http://127.0.0.1:8877/api/status'
