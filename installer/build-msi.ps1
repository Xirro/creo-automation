<#
  build-msi.ps1 - Build script for creating a WiX MSI for Creo Automation

  Prerequisites:
    - WiX Toolset (heat.exe, candle.exe, light.exe) available in PATH
    - Run on Windows PowerShell (desktop)

  Usage:
    .\build-msi.ps1 -Version 1.2.0 -SourceDir "..\dist" -OutDir "..\installer-output"

  What it does:
    1. Harvests the application files from SourceDir into a generated Harvested.wxs using heat.exe
    2. Invokes candle.exe to compile Product.wxs and Harvested.wxs into .wixobj files
    3. Invokes light.exe to link objects into a final MSI named CreoAutomation-<version>.msi

  Notes:
    - The Product.wxs in installer/wix references a ComponentGroup with Id="AppComponents".
    - The UpgradeCode in Product.wxs is stable; Product Id is generated each build to enable major upgrades.
#>
[CmdletBinding()]
param(
  [Parameter(Mandatory = $false)]
  [string]$Version = $null,

  [Parameter(Mandatory = $true)]
  [string]$SourceDir,

  [Parameter(Mandatory = $false)]
  [string]$OutDir = "./installer-output"
)

$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$wixDir = Join-Path $scriptDir 'wix'
$productWxs = Join-Path $wixDir 'Product.wxs'
$harvestedWxs = Join-Path $wixDir 'Harvested.wxs'

# Determine version from package.json at the repository root (required)
try {
  if (-not $Version) {
    $repoRoot = Resolve-Path -Path (Join-Path $scriptDir "..")
    $packageJsonPath = Join-Path $repoRoot 'package.json'
    if (Test-Path $packageJsonPath) {
      $pkg = Get-Content -Path $packageJsonPath -Raw | ConvertFrom-Json
      if ($pkg.version) {
        $Version = $pkg.version
        Write-Host "Using version from package.json: $Version"
      }
    }
  } else {
    Write-Host "Using provided version: $Version"
  }
} catch {
  Write-Warning "Failed to read package.json for version: $_"
}

if (-not $Version) {
  Write-Error "package.json not found or missing 'version' field. Ensure package.json exists at repo root and contains a 'version'."
  exit 1
}

if (-not (Test-Path $productWxs)) {
  Write-Error "Product.wxs not found at $productWxs"
  exit 1
}

# Ensure output directory
$OutDirFull = Resolve-Path -Path $OutDir -ErrorAction SilentlyContinue
if (-not $OutDirFull) { New-Item -ItemType Directory -Path $OutDir -Force | Out-Null; $OutDirFull = Resolve-Path -Path $OutDir }
$OutDirFull = $OutDirFull.Path

# Resolve SourceDir to an absolute path and ensure it exists. This must be done
# before calling heat/candle so the preprocessor define -dSourceDir can be passed.
if (-not (Test-Path $SourceDir)) {
  Write-Error "SourceDir not found: $SourceDir"
  exit 1
}
$resolvedSourceDir = (Resolve-Path $SourceDir).Path

# Ensure the app icon is present in the SourceDir so the WiX Icon element can reference it.
# Search a few likely locations in the repo and copy the first match into the resolved SourceDir.
$iconName = 'creo-automation.ico'
$possibleIconPaths = @(
  (Join-Path $scriptDir $iconName),                       # installer/creo-automation.ico
  # repo root and common public image locations
  (Join-Path (Resolve-Path -Path (Join-Path $scriptDir ".." )).Path $iconName),
  (Join-Path (Join-Path (Resolve-Path -Path (Join-Path $scriptDir ".." )).Path "public\images") $iconName),
  (Join-Path (Join-Path (Resolve-Path -Path (Join-Path $scriptDir ".." )).Path "public\assets\images") $iconName)
)
try {
  $foundIcon = $null
  foreach ($p in $possibleIconPaths) {
    if ($p -and (Test-Path $p)) { $foundIcon = (Resolve-Path $p).Path; break }
  }
  if ($foundIcon -and (Test-Path $resolvedSourceDir)) {
    $destIcon = Join-Path $resolvedSourceDir $iconName
    Write-Host "Copying icon $foundIcon to $destIcon"
    Copy-Item -Path $foundIcon -Destination $destIcon -Force
  } else {
    Write-Host "Icon not found in repo locations; continuing without a custom icon. Searched:"
    foreach ($p in $possibleIconPaths) { Write-Host "  $p" }
  }
} catch {
  Write-Warning "Failed to copy icon: $_"
}

# Harvest files with heat.exe (create a fragment with a ComponentGroup Id=AppComponents)
Write-Host "Harvesting files from $SourceDir..."
## Use the resolved SourceDir path when calling heat and candle. heat.exe's -var var.SourceDir
## causes harvested paths to be emitted as $(var.SourceDir) in the fragment; candle must be
## passed -dSourceDir so Product.wxs can also reference $(var.SourceDir).
$heatArgs = @( 'dir', $resolvedSourceDir,
  '-cg', 'AppComponents',
  '-dr', 'INSTALLFOLDER',
  '-sfrag',
  '-scom',
  '-sreg',
  '-gg',
  '-var', 'var.SourceDir',
  '-out', $harvestedWxs )

& heat.exe @heatArgs
if ($LASTEXITCODE -ne 0) { Write-Error "heat.exe failed with exit code $LASTEXITCODE"; exit $LASTEXITCODE }

# Compile with candle.exe
Write-Host "Compiling WiX source..."
# Attempt to discover the main executable File Id inside the harvested fragment (common default name: CreoAutomation.exe)
$mainExeName = 'CreoAutomation.exe'
$mainExeId = $null
if (Test-Path $harvestedWxs) {
  $harvestedText = Get-Content -Path $harvestedWxs -Raw
  # Look for a File Id="SomeId" Source="...CreoAutomation.exe"
  $m = [regex]::Match($harvestedText, 'File\s+Id="(?<id>[^"]+)"[^>]*Source="[^"]*' + [regex]::Escape($mainExeName) + '"', 'IgnoreCase')
  if ($m.Success) { $mainExeId = $m.Groups['id'].Value }
}

## Pass defines to candle.exe. Use the already-resolved path string to ensure the preprocessor
## variable SourceDir is defined (so $(var.SourceDir) in Product.wxs is not undefined).
$candleArgs = @()
$candleArgs += ("-dProductVersion=$Version")
$candleArgs += ("-dSourceDir=$resolvedSourceDir")
# candle.exe requires the -out argument to be a directory (ending with '\') when multiple
# source files are provided. Ensure the out path ends with a backslash so candle treats it
# as an output directory instead of a single output file.
$candleOut = $OutDirFull
if (-not $candleOut.EndsWith('\')) { $candleOut = $candleOut + '\' }
$candleArgs += ("-out")
$candleArgs += $candleOut
if ($mainExeId) {
  Write-Host "Detected main exe File Id: $mainExeId"
  $candleArgs += ("-dMainExeId=$mainExeId")
}
$candleArgs += $productWxs
$candleArgs += $harvestedWxs

## Print the full candle.exe command for debugging in CI (each arg on its own line)
Write-Host "Running: candle.exe with args:"
foreach ($arg in $candleArgs) { Write-Host "  $arg" }

& candle.exe @candleArgs
if ($LASTEXITCODE -ne 0) { Write-Error "candle.exe failed with exit code $LASTEXITCODE"; exit $LASTEXITCODE }

# Collect generated .wixobj files
$wixObjs = Get-ChildItem -Path $OutDirFull -Filter '*.wixobj' -File | ForEach-Object { $_.FullName }

# Link with light.exe
$msiName = "CreoAutomation-$Version.msi"
$msiPath = Join-Path $OutDirFull $msiName
Write-Host "Linking into MSI $msiPath..."
## Ensure any external cabinet files are written into the output directory by
## passing the base path (-b) to light.exe. This causes cab1.cab, cab2.cab, ...
## to be created in $OutDirFull so they can be packaged alongside the MSI.
$lightArgs = @( '-out', $msiPath, '-b', $OutDirFull )
$lightArgs += $wixObjs

& light.exe @lightArgs
if ($LASTEXITCODE -ne 0) { Write-Error "light.exe failed with exit code $LASTEXITCODE"; exit $LASTEXITCODE }

Write-Host "MSI build complete: $msiPath"

# Optional signing: if SIGNING_PFX (path to a pfx) or SIGNING_CERT/SIGNING_PASSWORD are provided, sign the MSI using signtool
if ($env:SIGNING_PFX -or ($env:SIGNING_CERT -and $env:SIGNING_PASSWORD)) {
  Write-Host "Signing MSI..."
  $signtool = 'signtool'
  $timestamp = 'http://timestamp.digicert.com'
  if ($env:SIGNING_PFX) {
    $pfx = $env:SIGNING_PFX
    $signingPassword = $env:SIGNING_PASSWORD
    & $signtool sign /f $pfx /p $signingPassword /tr $timestamp /td sha256 /fd sha256 $msiPath
  } else {
    # Placeholder for cert in store
    & $signtool sign /n $env:SIGNING_CERT /tr $timestamp /td sha256 /fd sha256 $msiPath
  }
  if ($LASTEXITCODE -ne 0) { Write-Warning "signtool failed with exit code $LASTEXITCODE" } else { Write-Host "MSI signed." }
}
