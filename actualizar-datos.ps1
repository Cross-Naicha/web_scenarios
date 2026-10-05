$ErrorActionPreference = 'Stop'
$mysqlShell = 'C:\Program Files\MySQL\MySQL Shell 8.0\bin\mysqlsh.exe'
$query = "SELECT JSON_ARRAYAGG(JSON_OBJECT('id',a_id,'name',a_side,'reverse',b_side,'type',t_type,'size',s,'quantity',q,'scenario',scenario,'bag',bag)) AS data FROM glumthings.v_scenarios;"
$exportLines = & $mysqlShell --sql --result-format=tabbed --uri 'mysql://root@localhost:3306' --password --execute $query
if ($LASTEXITCODE -ne 0) { throw 'No se pudieron leer los datos de MySQL.' }
$jsonLine = $exportLines | Where-Object { $_.StartsWith('[') } | Select-Object -Last 1
if (-not $jsonLine) { throw 'MySQL no devolvió los datos esperados.' }
$rows = $jsonLine | ConvertFrom-Json
Set-Content -LiteralPath (Join-Path $PSScriptRoot 'scenarios-data.js') -Value ('window.SCENARIOS_DATA = ' + $jsonLine + ';') -Encoding utf8
Write-Output ('Datos actualizados: ' + $rows.Count + ' componentes.')
