## Desktop launcher for Creo Automation
## Starts the service or app if not running, then opens the browser to localhost:3000
param(
  [int]$Port = 3000,
  [string]$ServiceName = 'CreoAutomation',
  [int]$TimeoutSeconds = 10
)

## Desktop launcher: start service or app if needed, then wait until the HTTP endpoint responds.
try {
  $installDir = Join-Path $Env:ProgramFiles 'CreoAutomation'
  $launcher = Join-Path $installDir 'bin\run-app.bat'

  Add-Type -AssemblyName System.Windows.Forms | Out-Null

  function Show-Error([string]$msg, [string]$title = 'Creo Automation') {
    [System.Windows.Forms.MessageBox]::Show($msg, $title, [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Error) | Out-Null
  }

  function Test-Health([int]$port) {
    $uri = "http://localhost:$port/"
    try {
      $r = Invoke-WebRequest -Uri $uri -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
      return $true
    } catch {
      return $false
    }
  }

  function Wait-Until-Healthy([int]$port, [int]$timeoutSec) {
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    $intervalMs = 500
    while ($sw.Elapsed.TotalSeconds -lt $timeoutSec) {
      if (Test-Health -port $port) { return $true }
      Start-Sleep -Milliseconds $intervalMs
    }
    return $false
  }

  function Open-Url([string]$u) {
    try { Start-Process $u } catch { }
  }

  # Keep track if we started a service/process so we can clean up on failure
  $startedService = $false
  $startedProc = $null

  # If a service exists, prefer starting it
  $svc = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
  if ($svc) {
    if ($svc.Status -ne 'Running') {
      try {
        Start-Service -Name $ServiceName -ErrorAction Stop
        $startedService = $true
      } catch {
        # fallback to launching the bundled starter
        if (Test-Path $launcher) { $startedProc = Start-Process -FilePath $launcher -Verb RunAs -PassThru }
      }
    }

    if (Wait-Until-Healthy -port $Port -timeoutSec $TimeoutSeconds) {
      Open-Url "http://localhost:$Port/"
      exit 0
    } else {
      # health failed
      if ($startedProc) {
        try { Stop-Process -Id $startedProc.Id -Force -ErrorAction SilentlyContinue } catch { }
      }
      if ($startedService) {
        try { Stop-Service -Name $ServiceName -ErrorAction SilentlyContinue } catch { }
      }
      Show-Error "The application failed to respond on http://localhost:$Port within $TimeoutSeconds seconds. Please check the service logs or start the app manually." "Creo Automation - Start Failed"
      exit 1
    }
  }

  # No service registered; check for node process and launcher
  $nodeProc = Get-Process -Name 'node' -ErrorAction SilentlyContinue
  if (-not $nodeProc) {
    if (Test-Path $launcher) { $startedProc = Start-Process -FilePath $launcher -Verb RunAs -PassThru }
  }

  if (Wait-Until-Healthy -port $Port -timeoutSec $TimeoutSeconds) {
    Open-Url "http://localhost:$Port/"
    exit 0
  } else {
    if ($startedProc) {
      try { Stop-Process -Id $startedProc.Id -Force -ErrorAction SilentlyContinue } catch { }
    }
    Show-Error "The application failed to respond on http://localhost:$Port within $TimeoutSeconds seconds. Please check the logs or start the app manually." "Creo Automation - Start Failed"
    exit 1
  }

} catch {
  try { Start-Process "http://localhost:$Port/" } catch { }
  Show-Error "An unexpected error occurred while trying to start Creo Automation. Please start the application manually and check logs." "Creo Automation - Error"
  exit 1
}
