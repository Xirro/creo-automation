<#
build-dist.ps1

Prepare a distributable `dist/` folder containing:
 - built `node_modules` (run `npm ci` on builder)
 - app files (server.js, app/, public/, etc.)
 - Node runtime (copies node.exe and supporting files from PATH)

Run this on a Windows build machine (or developer machine) that has:
 - Node installed (same version you intend to ship)
 - Visual C++ build tools to compile native modules prior to copying

Usage:
  .\build-dist.ps1 -ProjectRoot 'C:\path\to\repo' -NodeExe (Get-Command node).Source
#>

param(
    [string]$ProjectRoot = (Get-Location).Path,
    [string]$NodeExe = $(Get-Command node -ErrorAction SilentlyContinue).Source
)

if (-not $NodeExe) {
    Write-Error "node executable not found on PATH. Install Node or pass -NodeExe path manually."
    exit 1
}

Write-Host "ProjectRoot: $ProjectRoot"
Write-Host "NodeExe: $NodeExe"

Set-Location $ProjectRoot

$dist = Join-Path $ProjectRoot 'dist'
if (Test-Path $dist) { Remove-Item $dist -Recurse -Force }
New-Item -ItemType Directory -Path $dist | Out-Null

Write-Host "Installing production dependencies (builder must have VC++ toolchain if native modules present)"
npm ci --only=production

Write-Host "Copying application files to dist..."
$includes = @('server.js','package.json','app','public','views','uploads','creoson','modules','scripts')
foreach ($i in $includes) {
    if (Test-Path $i) {
        Write-Host "Copying $i ..."
        Copy-Item $i -Destination (Join-Path $dist $i) -Recurse -Force
    }
}

Write-Host "Copying node_modules (production) ..."
if (Test-Path 'node_modules') {
    Copy-Item 'node_modules' -Destination (Join-Path $dist 'node_modules') -Recurse -Force
} else {
    Write-Warning "node_modules not found. Did npm ci finish successfully?"
}

Write-Host "Copying Node runtime files from: $NodeExe"
$nodeDir = Split-Path $NodeExe
New-Item -ItemType Directory -Path (Join-Path $dist 'node') | Out-Null
Get-ChildItem -Path $nodeDir -Filter 'node*.*' -File | ForEach-Object {
    Copy-Item $_.FullName -Destination (Join-Path $dist 'node') -Force
}

# Also copy important DLLs (if present)
$dlls = @('vcruntime140.dll','msvcp140.dll')
foreach ($dll in $dlls) {
    $dllPath = Join-Path $nodeDir $dll
    if (Test-Path $dllPath) { Copy-Item $dllPath -Destination (Join-Path $dist 'node') -Force }
}

Write-Host "Creating helper run script..."
New-Item -ItemType Directory -Path (Join-Path $dist 'bin') | Out-Null
Set-Content -Path (Join-Path $dist 'bin\run-app.bat') -Value '@echo off
cd /d "%~dp0.."
start "Creo-Automation" "%~dp0\..\node\node.exe" server.js
' -Encoding ASCII

# Create a simple wrapper that calls the PowerShell service helper to install the service
$registerCmdPath = Join-Path $dist 'bin\register-service.cmd'
$registerCmd = "@echo off`r`nREM Wrapper to call PowerShell service-helper`r`nset APPDIR=%~dp0..\`r`npowershell -NoProfile -ExecutionPolicy Bypass -File \"%APPDIR%\\scripts\\service-helper.ps1\" -Action install -AppDir \"%APPDIR%\" -ServiceName \"CreoAutomation\"`r`n"
# Use a here-string to avoid PowerShell treating % or backslashes specially inside the string
$registerCmd = @'
@echo off
REM Wrapper to call PowerShell service-helper
set APPDIR=%~dp0..
powershell -NoProfile -ExecutionPolicy Bypass -File "%APPDIR%\scripts\service-helper.ps1" -Action install -AppDir "%APPDIR%" -ServiceName "CreoAutomation"
'@
Set-Content -Path $registerCmdPath -Value $registerCmd -Encoding ASCII

Write-Host "Including NSSM (service manager) in dist..."
$nssmUrl = 'https://nssm.cc/release/nssm-2.24.zip'
$tempZip = Join-Path $env:TEMP 'nssm.zip'
$tempDir = Join-Path $env:TEMP 'nssm_extract'
if (Test-Path $tempZip) { Remove-Item $tempZip -Force }
if (Test-Path $tempDir) { Remove-Item $tempDir -Recurse -Force }
try {
    Write-Host "Downloading NSSM from $nssmUrl ..."
    Invoke-WebRequest -Uri $nssmUrl -OutFile $tempZip -UseBasicParsing -ErrorAction Stop
    Write-Host "Extracting NSSM..."
    Expand-Archive -Path $tempZip -DestinationPath $tempDir -Force
    # NSSM zip contains win32/win64 folders; prefer win64
    $nssmExe = Join-Path $tempDir 'nssm-2.24\win64\nssm.exe'
    if (-not (Test-Path $nssmExe)) {
        $nssmExe = Get-ChildItem -Path $tempDir -Recurse -Filter 'nssm.exe' -ErrorAction SilentlyContinue | Select-Object -First 1 | ForEach-Object { $_.FullName }
    }
    if ($nssmExe -and (Test-Path $nssmExe)) {
        Copy-Item $nssmExe -Destination (Join-Path $dist 'nssm.exe') -Force
        Write-Host "Copied nssm.exe to dist"
    } else {
        Write-Warning "nssm.exe not found in extracted archive; skipping NSSM inclusion."
    }
} catch {
    Write-Warning "Failed to download or extract NSSM: $_"
}

Write-Host "Dist prepared at: $dist"
Write-Host "Next: use the Inno Setup script in installer/setup.iss to build an installer, or zip the dist folder for distribution."
