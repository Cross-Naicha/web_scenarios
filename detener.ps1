$pidFile = Join-Path $PSScriptRoot 'server.pid'
if (-not (Test-Path -LiteralPath $pidFile)) { Write-Output 'No hay un servidor registrado en segundo plano.'; exit }
$serverPid = [int](Get-Content -LiteralPath $pidFile)
$serverProcess = Get-CimInstance Win32_Process -Filter "ProcessId = $serverPid"
if ($serverProcess -and $serverProcess.Name -eq 'node.exe' -and $serverProcess.CommandLine -match 'server\.cjs') {
    $connection = Get-NetTCPConnection -LocalPort 5501 -State Listen -ErrorAction SilentlyContinue
    if ($connection.OwningProcess -contains $serverPid) {
        Stop-Process -Id $serverPid
        Write-Output 'Servidor de Gloomhaven detenido.'
    } else { throw 'El proceso registrado no está escuchando en el puerto de Gloomhaven.' }
} elseif ($serverProcess) { throw 'El proceso registrado no corresponde al servidor; no se detuvo.' }
