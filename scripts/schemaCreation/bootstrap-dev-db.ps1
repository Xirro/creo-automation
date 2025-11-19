<#
.SYNOPSIS
  Bootstrap a local/dev MySQL database for the app using the schema creation scripts.

.DESCRIPTION
  This script safely creates a database, three app users, grants privileges,
  and runs the schema creation Node scripts found in `scripts\schemaCreation`.
  It prompts for an admin account and for confirmation before any destructive
  operations. It will skip destructive `createSubSchema.js` unless explicitly
  requested with `-AllowDestructive`.

.EXAMPLE
  .\scripts\schemaCreation\bootstrap-dev-db.ps1 -DbHost localhost -DbPort 3306 -DbName saidb

#>

[CmdletBinding()]
param(
    [string]$DbHost = $env:DB_HOST -or 'localhost',
    [int]$DbPort = [int]($env:DB_PORT -or 3306),
    [string]$DbName = $env:DB_NAME -or 'saidb',

    [string]$SaiAdminUser = $env:SAI_ADMIN_DB_USER -or 'sai_admin',
    [string]$SaiEngUser  = $env:SAI_ENG_DB_USER  -or 'sai_eng',
    [string]$SaiUserUser = $env:SAI_USER_DB_USER -or 'sai_user',

    [switch]$AllowDestructive,    # must be supplied to run createSubSchema.js
    [switch]$NoRunScripts         # skip running Node schema scripts
)

function Read-Password($prompt) {
    $secure = Read-Host -AsSecureString $prompt
    return [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure))
}

Write-Host "Bootstrap will target DB host: $DbHost  port: $DbPort  database: $DbName" -ForegroundColor Cyan

# Get admin credentials
$adminUser = Read-Host 'DB admin user (has CREATE DATABASE & CREATE USER rights)'
$adminPwdPlain = Read-Password 'DB admin password'

if (-not $adminUser -or -not $adminPwdPlain) {
    Write-Error 'Admin credentials required. Aborting.'; exit 1
}

# Get app user passwords (prompt, or use environment variables if present)
$saiAdminPwd = $env:SAI_ADMIN_DB_PASS -or (Read-Password "Password for $SaiAdminUser")
$saiEngPwd  = $env:SAI_ENG_DB_PASS  -or (Read-Password "Password for $SaiEngUser")
$saiUserPwd = $env:SAI_USER_DB_PASS -or (Read-Password "Password for $SaiUserUser")

Write-Host "About to create database '$DbName' and users: $SaiAdminUser, $SaiEngUser, $SaiUserUser" -ForegroundColor Yellow
if (-not (Read-Host 'Type YES to continue') -eq 'YES') { Write-Host 'Aborted by user.'; exit 1 }

# Build SQL
$createSql = @"
CREATE DATABASE IF NOT EXISTS `${DbName}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '${SaiAdminUser}'@'%' IDENTIFIED BY '${saiAdminPwd}';
CREATE USER IF NOT EXISTS '${SaiEngUser}'@'%' IDENTIFIED BY '${saiEngPwd}';
CREATE USER IF NOT EXISTS '${SaiUserUser}'@'%' IDENTIFIED BY '${saiUserPwd}';
GRANT ALL PRIVILEGES ON `${DbName}`.* TO '${SaiAdminUser}'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON `${DbName}`.* TO '${SaiEngUser}'@'%';
GRANT SELECT ON `${DbName}`.* TO '${SaiUserUser}'@'%';
FLUSH PRIVILEGES;
"@

# Try to find mysql client
$mysqlCmd = Get-Command mysql -ErrorAction SilentlyContinue
if ($mysqlCmd) {
    Write-Host 'Running SQL via mysql client...' -ForegroundColor Green
    & mysql -h $DbHost -P $DbPort -u $adminUser -p$adminPwdPlain -e $createSql
    if ($LASTEXITCODE -ne 0) { Write-Warning 'mysql client returned non-zero exit code. Please verify DB state manually.' }
} else {
    Write-Warning 'mysql client not found on PATH; skipping DB/user creation. You can run the SQL manually or install the mysql client.'
    Write-Host 'SQL to run:'; Write-Host $createSql
}

if ($NoRunScripts) { Write-Host 'Skipping Node schema scripts as requested (-NoRunScripts).'; exit 0 }

Write-Host 'Running schema creation Node scripts (non-destructive order)...' -ForegroundColor Cyan

$scripts = @(
    '.\createCatalogSchema.js',
    '.\createFinalSchema.js',
    '.\createCreoSchema.js',
    '.\createMBOMSchema.js',
    '.\newPnSchema.js'
)

foreach ($s in $scripts) {
    $path = Join-Path -Path (Split-Path -Parent $MyInvocation.MyCommand.Path) $s
    if (-not (Test-Path $path)) { Write-Warning "Schema script not found: $path; skipping."; continue }
    Write-Host "Running: node $path" -ForegroundColor Gray
    node $path
    if ($LASTEXITCODE -ne 0) { Write-Error "Script failed: $path; stopping."; exit 1 }
}

if ($AllowDestructive) {
    $destructive = Join-Path -Path (Split-Path -Parent $MyInvocation.MyCommand.Path) 'createSubSchema.js'
    if (Test-Path $destructive) {
        Write-Host "User permitted destructive script. Running: $destructive" -ForegroundColor Red
        node $destructive
    } else { Write-Warning "$destructive not found; skipped." }
} else {
    Write-Host 'Skipping destructive script createSubSchema.js (use -AllowDestructive to enable).' -ForegroundColor Yellow
}

Write-Host 'Bootstrap complete.' -ForegroundColor Green
