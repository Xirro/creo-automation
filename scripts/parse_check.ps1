$path = 'c:\Users\huy.ngo\Documents\creo-automation\scripts\build-dist.ps1'
$s = Get-Content -Raw -Path $path
# Parse the script without executing it
[System.Management.Automation.Language.Parser]::ParseInput($s, [ref]$null, [ref]$null) | Out-Null
Write-Host 'PARSE_OK'
