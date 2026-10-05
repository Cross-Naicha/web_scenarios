# Preparar escenarios de Gloomhaven

## Acceso desde el teléfono

Ejecutá `iniciar.cmd` para iniciar el servidor en el puerto 5501. En esta PC: http://localhost:5501. Desde otro dispositivo conectado a tu red Tailscale, usá la dirección que muestra el servidor. El servidor imprime las direcciones actuales al iniciar. La PC debe permanecer encendida y Tailscale conectado en ambos dispositivos para acceder fuera de casa. Esto es acceso privado por Tailscale; no es una publicación pública. Para detenerlo, pulsá Ctrl+C en la terminal. Si el servidor ya está funcionando en segundo plano, detenelo antes de volver a iniciarlo.

Solo se sirven los cuatro archivos de la página. Las marcas de preparación se guardan por navegador, no se sincronizan entre dispositivos.

El servidor iniciado desde Codex funciona en segundo plano. Podés detenerlo ejecutando `detener.ps1` en PowerShell; luego iniciar `iniciar.cmd` para administrarlo desde una terminal visible. Después de reiniciar la PC, ejecutá `iniciar.cmd` nuevamente.

Abrí `index.html` en el navegador. Incluye 94 escenarios exportados de `glumthings.v_scenarios`, filtros por escenario, tipo y texto, y marcas de preparación guardadas localmente por escenario.

La página funciona sin conexión y sin dependencias. Los datos son una copia de la base al momento de la exportación; no se actualizan en vivo. Para actualizarla, ejecutá `actualizar-datos.ps1` en PowerShell e ingresá la contraseña de MySQL cuando la solicite. La contraseña no se guarda en los archivos de la página.

`q` representa la cantidad disponible de la pieza (proviene de `things.quantity`); no es una cantidad requerida por escenario. Los valores vacíos se muestran como «sin indicar». `s` indica el tamaño de la pieza en hexágonos. Consultá el plano del escenario para determinar su colocación y cantidad requerida.

