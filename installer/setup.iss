; Minimal canonical Inno Setup script for Creo Automation
[Setup]
AppName=Creo Automation
AppVersion=1.0.0
DefaultDirName={commonpf64}\CreoAutomation
DisableProgramGroupPage=yes
OutputDir=..\dist_installer
OutputBaseFilename=CreoAutomationInstaller
Compression=lzma

[Files]
Source: "..\dist\*"; DestDir: "{app}"; Flags: recursesubdirs createallsubdirs

[Icons]
Name: "{group}\Creo Automation"; Filename: "{app}\bin\run-app.bat"

[Run]
Filename: "{win}\system32\WindowsPowerShell\v1.0\powershell.exe"; \
  Parameters: "-NoProfile -ExecutionPolicy Bypass -File ""{app}\scripts\postinstall-config.ps1"" -Ini ""{app}\dbinstaller.ini"" -InstallDir ""{app}"""; \
  Flags: postinstall waituntilterminated; Description: "Post-install DB configuration"; StatusMsg: "Configuring database settings"

Filename: "{app}\bin\run-app.bat"; Description: "Start Creo Automation"; Flags: nowait postinstall skipifsilent

Filename: "{app}\bin\register-service.cmd"; Description: "Register CreoAutomation service"; Flags: runhidden postinstall skipifsilent; StatusMsg: "Configuring Windows service (CreoAutomation)"

[UninstallRun]
Filename: "{app}\bin\register-service.cmd"; Parameters: "remove"; Flags: runhidden; RunOnceId: "UnregisterCreoAutomationService"

[Code]
function InitializeSetup(): Boolean;
begin
  Result := True;
end;

var
  DBPage: TWizardPage;
  EditHost, EditPort, EditName, EditUser, EditPass: TEdit;
  CheckSsl: TCheckBox;

procedure CreateDBPage();
begin
  DBPage := CreateCustomPage(wpSelectDir, 'Database Configuration', 'Enter database connection details');
  EditHost := TEdit.Create(DBPage); EditHost.Parent := DBPage.Surface; EditHost.Left := 0; EditHost.Top := 8; EditHost.Width := DBPage.SurfaceWidth; EditHost.Text := 'localhost';
  EditPort := TEdit.Create(DBPage); EditPort.Parent := DBPage.Surface; EditPort.Left := 0; EditPort.Top := EditHost.Top + 32; EditPort.Width := DBPage.SurfaceWidth; EditPort.Text := '3306';
  EditName := TEdit.Create(DBPage); EditName.Parent := DBPage.Surface; EditName.Left := 0; EditName.Top := EditPort.Top + 32; EditName.Width := DBPage.SurfaceWidth; EditName.Text := 'saidb';
  EditUser := TEdit.Create(DBPage); EditUser.Parent := DBPage.Surface; EditUser.Left := 0; EditUser.Top := EditName.Top + 32; EditUser.Width := DBPage.SurfaceWidth; EditUser.Text := 'doadmin';
  EditPass := TEdit.Create(DBPage); EditPass.Parent := DBPage.Surface; EditPass.Left := 0; EditPass.Top := EditUser.Top + 32; EditPass.Width := DBPage.SurfaceWidth; EditPass.PasswordChar := '*';
  CheckSsl := TCheckBox.Create(DBPage); CheckSsl.Parent := DBPage.Surface; CheckSsl.Left := 0; CheckSsl.Top := EditPass.Top + 32; CheckSsl.Caption := 'Use SSL for DB connection';
end;

function NextButtonClick(CurPageID: Integer): Boolean;
begin
  Result := True;
  if CurPageID = DBPage.ID then
  begin
    SetIniString('DB', 'Host', EditHost.Text, ExpandConstant('{app}\\dbinstaller.ini'));
    SetIniString('DB', 'Port', EditPort.Text, ExpandConstant('{app}\\dbinstaller.ini'));
    SetIniString('DB', 'Name', EditName.Text, ExpandConstant('{app}\\dbinstaller.ini'));
    SetIniString('DB', 'User', EditUser.Text, ExpandConstant('{app}\\dbinstaller.ini'));
    SetIniString('DB', 'Pass', EditPass.Text, ExpandConstant('{app}\\dbinstaller.ini'));
    if CheckSsl.Checked then SetIniString('DB', 'Ssl', '1', ExpandConstant('{app}\\dbinstaller.ini')) else SetIniString('DB', 'Ssl', '0', ExpandConstant('{app}\\dbinstaller.ini'));
  end;
end;

procedure InitializeWizard();
begin
  CreateDBPage();
end;


