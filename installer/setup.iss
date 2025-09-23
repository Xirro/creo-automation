[Setup]
AppName=Creo Automation
AppVersion=1.0.0
DefaultDirName={pf64}\CreoAutomation
DisableProgramGroupPage=yes
OutputDir=..\dist_installer
OutputBaseFilename=CreoAutomationInstaller
Compression=lzma

[Files]
; Copy the dist folder contents into the installed program directory
; Using {src} to reference the script directory and a relative dist folder created by the build script
Source: "{src}\..\dist\*"; DestDir: "{app}"; Flags: recursesubdirs createallsubdirs

[Icons]
Name: "{group}\Creo Automation"; Filename: "{app}\bin\run-app.bat"

[Run]
; Run the app (start once)
Filename: "{app}\bin\run-app.bat"; Description: "Start Creo Automation"; Flags: nowait postinstall skipifsilent
; If service registration is desired, call the bundled PowerShell helper which will handle elevation and nssm logic
Filename: "{sys}\WindowsPowerShell\v1.0\powershell.exe"; Parameters: "-NoProfile -ExecutionPolicy Bypass -File ""{app}\scripts\service-helper.ps1"" -Action install -AppDir ""{app}"" -ServiceName ""CreoAutomation"""; Flags: runhidden postinstall skipifsilent; StatusMsg: "Configuring Windows service (CreoAutomation)"

[UninstallRun]
; Call the PowerShell helper to stop and remove the service during uninstall
Filename: "{sys}\WindowsPowerShell\v1.0\powershell.exe"; Parameters: "-NoProfile -ExecutionPolicy Bypass -File ""{app}\scripts\service-helper.ps1"" -Action remove -AppDir ""{app}"" -ServiceName ""CreoAutomation"""; Flags: runhidden uninsrun

[Code]
function InitializeSetup(): Boolean;
begin
  Result := True;
end;
