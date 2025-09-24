[Setup]
AppName=Creo Automation
AppVersion=1.0.0
DefaultDirName={commonpf64}\CreoAutomation
DisableProgramGroupPage=yes
OutputDir=..\dist_installer
OutputBaseFilename=CreoAutomationInstaller
Compression=lzma

[Files]
; Copy the dist folder contents into the installed program directory
; Using {src} to reference the script directory and a relative dist folder created by the build script
Source: "..\dist\*"; DestDir: "{app}"; Flags: recursesubdirs createallsubdirs

[Icons]
Name: "{group}\Creo Automation"; Filename: "{app}\bin\run-app.bat"

[Run]
; Run the app (start once)
Filename: "{app}\bin\run-app.bat"; Description: "Start Creo Automation"; Flags: nowait postinstall skipifsilent
; If service registration is desired, call the bundled PowerShell helper which will handle elevation and nssm logic
; Prefer a small wrapper cmd to avoid complex quoting in Inno Parameters
Filename: "{app}\bin\register-service.cmd"; Description: "Register CreoAutomation service"; Flags: runhidden postinstall skipifsilent; StatusMsg: "Configuring Windows service (CreoAutomation)"

[UninstallRun]
; Call the PowerShell helper to stop and remove the service during uninstall
Filename: "{app}\bin\register-service.cmd"; Parameters: "remove"; Flags: runhidden; RunOnceId: "UnregisterCreoAutomationService"

[Code]
function InitializeSetup(): Boolean;
begin
  Result := True;
end;
