<#
.SYNOPSIS
  Helper to install/start/stop/remove the CreoAutomation Windows service using nssm.exe.

.DESCRIPTION
  This script wraps nssm.exe usage with checks for elevation, retries, logging, and safe failure handling.
  It is intended to be invoked by the installer (Inno Setup) after files are laid down in {app}.

.PARAMETER Action
  One of: install, start, stop, remove

.PARAMETER AppDir
  Path to the installed application directory (where nssm.exe and node reside).

.PARAMETER ServiceName
  Optional service name to use (default: CreoAutomation)

EXAMPLE
  .\service-helper.ps1 -Action install -AppDir 'C:\Program Files\CreoAutomation' -ServiceName 'CreoAutomation'
#>

param(
    [Parameter(Mandatory=$true)] [ValidateSet('install','start','stop','remove')] [string]$Action,
    [Parameter(Mandatory=$true)] [string]$AppDir,
    [string]$ServiceName = 'CreoAutomation'
)

function Write-Log {
    param([string]$Message)
    $t = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    "$t - $Message" | Out-File -FilePath (Join-Path $AppDir 'service-helper.log') -Append -Encoding UTF8
}

function Is-Admin {
    $current = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
    return $current.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

if (-not (Test-Path $AppDir)) {
    Write-Output "AppDir not found: $AppDir"
    exit 2
}

Write-Log "service-helper invoked: Action=$Action, AppDir=$AppDir, ServiceName=$ServiceName"

if (-not (Is-Admin)) {
    Write-Log "Not running as administrator. Service operations require elevated privileges."
    Write-Output "NEED_ADMIN"
    exit 3
}

# locate nssm.exe (prefer in AppDir)
$nssmLocal = Join-Path $AppDir 'nssm.exe'
$nssm = $null
if (Test-Path $nssmLocal) { $nssm = $nssmLocal }
else {
    # try PATH
    try { $nssm = (Get-Command nssm.exe -ErrorAction SilentlyContinue).Source } catch { }
}

if (-not $nssm) {
    Write-Log "nssm.exe not found in AppDir or PATH."
    Write-Output "NO_NSSM"
    exit 4
}

function Run-Nssm {
    param([string[]]$Args)
    $cmd = & $nssm @Args 2>&1
    $rc = $LASTEXITCODE
    Write-Log "nssm $($Args -join ' ') -> exit $rc; output: $cmd"
    return $rc
}

# Ensure logs directory exists and rotate if too large
$logsDir = Join-Path $AppDir 'logs'
if (-not (Test-Path $logsDir)) { New-Item -ItemType Directory -Path $logsDir | Out-Null }
$logFile = Join-Path $logsDir 'service-helper.log'
try {
    if (Test-Path $logFile) {
        $size = (Get-Item $logFile).Length
        if ($size -gt 5MB) {
            $bak = "$logFile.$((Get-Date).ToString('yyyyMMddHHmmss')).bak"
            Move-Item $logFile $bak -Force
        }
    }
} catch {
    # non-fatal
}

switch ($Action) {
    'install' {
        # Arguments: install <ServiceName> <pathToExe> [args...]
        $nodeExe = Join-Path $AppDir 'node\node.exe'
        if (-not (Test-Path $nodeExe)) {
            Write-Log "node.exe not found at $nodeExe"
            exit 5
        }
        # Remove existing service if present
        Run-Nssm @('status', $ServiceName) | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Log "Service $ServiceName already present; attempting remove first"
            Run-Nssm @('remove', $ServiceName, 'confirm') | Out-Null
        }

        $rc = Run-Nssm @('install', $ServiceName, $nodeExe, 'server.js')
        if ($rc -ne 0) { Write-Log "nssm install failed with exit $rc"; exit 6 }

        # Optionally set service parameters (directory, stdout/err files)
        Run-Nssm @('set', $ServiceName, 'AppDirectory', $AppDir) | Out-Null
        $stdout = Join-Path $AppDir 'logs\service-out.log'
        $stderr = Join-Path $AppDir 'logs\service-err.log'
        New-Item -ItemType Directory -Path (Join-Path $AppDir 'logs') -ErrorAction SilentlyContinue | Out-Null
        Run-Nssm @('set', $ServiceName, 'AppStdout', $stdout) | Out-Null
        Run-Nssm @('set', $ServiceName, 'AppStderr', $stderr) | Out-Null

        $rc2 = Run-Nssm @('start', $ServiceName)
        if ($rc2 -ne 0) { Write-Log "nssm start returned $rc2"; exit 7 }
        Write-Log "Service $ServiceName installed and started successfully"
    }
    'start' {
        $rc = Run-Nssm @('start', $ServiceName)
        exit $rc
    }
    'stop' {
        $rc = Run-Nssm @('stop', $ServiceName)
        exit $rc
    }
    'remove' {
        # stop then remove
        Run-Nssm @('stop', $ServiceName) | Out-Null
        $rc = Run-Nssm @('remove', $ServiceName, 'confirm')
        if ($rc -ne 0) { Write-Log "nssm remove returned $rc"; exit 8 }
        Write-Log "Service $ServiceName removed"
    }
}

exit 0
