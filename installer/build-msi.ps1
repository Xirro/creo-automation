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
  [string]$Version,

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

# If Version wasn't supplied, try to read it from package.json at repo root
if (-not $Version) {
  try {
    $repoRoot = Resolve-Path -Path (Join-Path $scriptDir "..")
    $packageJsonPath = Join-Path $repoRoot 'package.json'
    if (Test-Path $packageJsonPath) {
      $pkg = Get-Content -Path $packageJsonPath -Raw | ConvertFrom-Json
      if ($pkg.version) {
        $Version = $pkg.version
        Write-Host "No -Version provided; using version from package.json: $Version"
      }
    }
  } catch {
    Write-Warning "Failed to read package.json for version: $_"
  }

  if (-not $Version -and $env:BUILD_VERSION) {
    $Version = $env:BUILD_VERSION
    Write-Host "Using BUILD_VERSION from environment: $Version"
  }

  if (-not $Version) {
    Write-Error "Version parameter not supplied and package.json / BUILD_VERSION could not be read. Provide -Version or set BUILD_VERSION in env."
    exit 1
  }
}

if (-not (Test-Path $productWxs)) {
  Write-Error "Product.wxs not found at $productWxs"
  exit 1
}

# Ensure output directory
$OutDirFull = Resolve-Path -Path $OutDir -ErrorAction SilentlyContinue
if (-not $OutDirFull) { New-Item -ItemType Directory -Path $OutDir -Force | Out-Null; $OutDirFull = Resolve-Path -Path $OutDir }
$OutDirFull = $OutDirFull.Path

# If an icon exists in the repo installer folder, copy it into the SourceDir so the WiX Icon element can reference it
$repoIcon = Join-Path $scriptDir 'creo-automation.ico'
try {
  if ((Test-Path $repoIcon) -and (Test-Path $SourceDir)) {
    $destIcon = Join-Path (Resolve-Path $SourceDir) 'creo-automation.ico'
    Write-Host "Copying repository icon $repoIcon to $destIcon"
    Copy-Item -Path $repoIcon -Destination $destIcon -Force
  }
} catch {
  Write-Warning "Failed to copy icon: $_"
}

# Harvest files with heat.exe (create a fragment with a ComponentGroup Id=AppComponents)
Write-Host "Harvesting files from $SourceDir..."
$heatArgs = @( 'dir', (Resolve-Path $SourceDir),
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

$candleArgs = @( '-dProductVersion=' + $Version, '-dSourceDir=' + (Resolve-Path $SourceDir), '-out', $OutDirFull )
if ($mainExeId) { Write-Host "Detected main exe File Id: $mainExeId"; $candleArgs += ('-dMainExeId=' + $mainExeId) }
$candleArgs += $productWxs
$candleArgs += $harvestedWxs

& candle.exe @candleArgs
if ($LASTEXITCODE -ne 0) { Write-Error "candle.exe failed with exit code $LASTEXITCODE"; exit $LASTEXITCODE }

# Collect generated .wixobj files
$wixObjs = Get-ChildItem -Path $OutDirFull -Filter '*.wixobj' -File | ForEach-Object { $_.FullName }

# Link with light.exe
$msiName = "CreoAutomation-$Version.msi"
$msiPath = Join-Path $OutDirFull $msiName
Write-Host "Linking into MSI $msiPath..."
$lightArgs = @( '-out', $msiPath )
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
