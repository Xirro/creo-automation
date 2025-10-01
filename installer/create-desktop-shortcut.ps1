<#
create-desktop-shortcut.ps1
Creates a desktop shortcut to the Creo Automation launcher after install.
This script should be executed from Inno Setup as a postinstall step and will:
 - only create the shortcut if the 'desktopicon' task was selected (Inno checks pass this responsibility)
 - create a shortcut that runs PowerShell to execute the launcher script
 - set the icon to the installed `{app}\creo-automation.ico`

Parameters expected (Inno will pass them):
 -InstallDir <path to installed app>
#>
param(
  [Parameter(Mandatory=$true)][string]$InstallDir
)

Add-Type -AssemblyName System.Windows.Forms | Out-Null

function Show-Error([string]$msg, [string]$title = 'Creo Automation') {
  [System.Windows.Forms.MessageBox]::Show($msg, $title, [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Error) | Out-Null
}

; Create desktop shortcut immediately (no health check)

try {
  $desktop = [Environment]::GetFolderPath('Desktop')
  $shortcutPath = Join-Path $desktop 'Creo Automation.lnk'
  $launcher = Join-Path $InstallDir 'bin\desktop-launcher.ps1'
  $icon = Join-Path $InstallDir 'creo-automation.ico'

  if (Test-Path $shortcutPath) { Write-Output "Shortcut already exists: $shortcutPath"; exit 0 }

  $wsh = New-Object -ComObject WScript.Shell
  $sc = $wsh.CreateShortcut($shortcutPath)
  $sc.TargetPath = (Join-Path $Env:WINDIR 'system32\WindowsPowerShell\v1.0\powershell.exe')
  $sc.Arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$launcher`""
  $sc.WorkingDirectory = $InstallDir
  if (Test-Path $icon) { $sc.IconLocation = "$icon,0" }
  $sc.Save()
  Write-Output "Created desktop shortcut: $shortcutPath"
  exit 0
} catch {
  Write-Error "Failed to create desktop shortcut: $_"
  exit 1
}
