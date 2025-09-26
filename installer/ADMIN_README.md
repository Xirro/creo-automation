# Creo Automation — Admin Quick Start (post-install)

This document lists the exact steps and commands an administrator should run after installing the Windows installer produced by the CI pipeline.

1) Run the installer
 - Right-click the installer executable and select "Run as administrator".

2) Run the post-install DB configuration
 - The installer will attempt to run the bundled PowerShell helper `scripts/postinstall-config.ps1` which prompts for DB connection values and writes `app/config/database.local.js`.
 - If you need to run it manually (or reconfigure), open an elevated PowerShell prompt and run:

```powershell
Set-Location 'C:\Program Files\CreoAutomation'  # or your custom install dir
.
powershell -NoProfile -ExecutionPolicy Bypass -File '.\app\scripts\postinstall-config.ps1' '.\'
```

3) Verify files installed
 - Confirm Node runtime exists: `C:\Program Files\CreoAutomation\node\node.exe`
 - Confirm NSSM exists: `C:\Program Files\CreoAutomation\nssm.exe`
 - Confirm post-install config file: `C:\Program Files\CreoAutomation\app\config\database.local.js`

4) Register / start service (if installer did not already)
 - If the service was not created, run (elevated):

```powershell
Set-Location 'C:\Program Files\CreoAutomation'
.
.\n+".\bin\register-service.cmd"
# To remove service:
".\bin\register-service.cmd" remove
```

5) Check service status
 - Using PowerShell:

```powershell
Get-Service -Name 'CreoAutomation'
# or
sc query "CreoAutomation"
```

6) Smoke test HTTP
 - From the local machine, test the web UI:

```powershell
Invoke-WebRequest http://localhost:3000/ -UseBasicParsing
```

7) Troubleshooting tips
 - If Node fails to start due to missing runtime DLLs (vcruntime140.dll / msvcp140.dll), install the Visual C++ Redistributable (2015-2019) from Microsoft.
 - Check NSSM logs or service stdout/stderr files (NSSM can be configured via `scripts/service-helper.ps1`).
 - If DB connection fails, re-run `postinstall-config.ps1` to correct credentials or network access.

8) Harden encrypted password file ACLs (optional)
 - The post-install helper now stores the DB password encrypted with Windows DPAPI in `app/config/db_pass.enc`.
 - To restrict read access to Administrators, SYSTEM, and a specific service account, re-run the post-install helper and provide the service account name (DOMAIN\svcUser) via the `-ServiceAccount` parameter. Example (elevated PowerShell):

```powershell
Set-Location 'C:\Program Files\CreoAutomation'
.\app\scripts\postinstall-config.ps1 -InstallDir 'C:\Program Files\CreoAutomation' -Host db.example.com -Port 3306 -Name saidb -User doadmin -Password 'secret' -Ssl -ServiceAccount 'MYDOMAIN\svcCreo'
```

 - This will write `app/config/db_pass.enc` and set ACLs so only Administrators, SYSTEM, and `MYDOMAIN\svcCreo` can read the file. If you run the installer and create the service under a specific service account, pass the same service account here so the service can access the password.

8) Security & secrets
 - `app/config/database.local.js` is ignored by Git (see `.gitignore`). Rotate DB credentials if you distributed an earlier installer containing repo credentials.

9) Verify ACLs and re-run helper

 - To inspect the ACLs on the encrypted password file (`db_pass.enc`), run this in an elevated PowerShell prompt:

```powershell
Get-Acl 'C:\Program Files\CreoAutomation\app\config\db_pass.enc' | Format-List -Property *
```

Look under the `Access` list for entries showing `BUILTIN\Administrators`, `NT AUTHORITY\SYSTEM` and your service account (e.g. `MYDOMAIN\svcCreo`).

 - To re-run the post-install helper and update the ACLs (for example if you created the service after installing), run the helper again with the `-ServiceAccount` parameter (elevated):

```powershell
Set-Location 'C:\Program Files\CreoAutomation'
.\app\scripts\postinstall-config.ps1 -InstallDir 'C:\Program Files\CreoAutomation' -Host db.example.com -Port 3306 -Name saidb -User doadmin -Password 'secret' -Ssl -ServiceAccount 'MYDOMAIN\svcCreo'
```

 - The helper will rewrite `db_pass.enc` and then apply hardened ACLs that include the provided service account.
