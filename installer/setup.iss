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
Source: "desktop-launcher.ps1"; DestDir: "{app}\bin"; Flags: ignoreversion
Source: "creo-automation.ico"; DestDir: "{app}"; Flags: ignoreversion

[Tasks]
Name: "desktopicon"; Description: "Create a desktop icon"; GroupDescription: "Additional icons:"; Flags: unchecked

[Icons]
Name: "{group}\Creo Automation"; Filename: "{app}\bin\run-app.bat"; IconFilename: "{app}\creo-automation.ico"
; Desktop icon will be created postinstall after service registration to avoid races
; The postinstall script will create the desktop shortcut only if the user selected the 'desktopicon' task.

[Run]
Filename: "{win}\system32\WindowsPowerShell\v1.0\powershell.exe"; \
  Parameters: "-NoProfile -ExecutionPolicy Bypass -File ""{app}\scripts\postinstall-config.ps1"" -Ini ""{app}\dbinstaller.ini"" -InstallDir ""{app}"""; \
  Flags: postinstall waituntilterminated; Description: "Post-install DB configuration"; StatusMsg: "Configuring database settings"

Filename: "{app}\bin\run-app.bat"; Description: "Start Creo Automation"; Flags: nowait postinstall skipifsilent

Filename: "{app}\bin\register-service.cmd"; Description: "Register CreoAutomation service"; Flags: runhidden postinstall skipifsilent; StatusMsg: "Configuring Windows service (CreoAutomation)"

; Create desktop shortcut after postinstall steps (only if user selected the task)
Filename: "{win}\system32\WindowsPowerShell\v1.0\powershell.exe"; \
  Parameters: "-NoProfile -ExecutionPolicy Bypass -File ""{app}\create-desktop-shortcut.ps1"" -InstallDir ""{app}"""; \
  Flags: postinstall runhidden skipifsilent; Description: "Create desktop shortcut"; StatusMsg: "Creating desktop shortcut"

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
  lblConn, lblCred, lblSec: TLabel;
  lblHost, lblPort, lblDBName, lblUser, lblPass: TLabel;

procedure CreateDBPage();
begin
  DBPage := CreateCustomPage(wpSelectDir, 'Database Configuration', 'Enter database connection details');
  // Connection header
  lblConn := TLabel.Create(DBPage); lblConn.Parent := DBPage.Surface; lblConn.Left := 0; lblConn.Top := 8; lblConn.Caption := 'Connection'; lblConn.Font.Style := [fsBold];
  lblHost := TLabel.Create(DBPage); lblHost.Parent := DBPage.Surface; lblHost.Left := 0; lblHost.Top := lblConn.Top + 24; lblHost.Caption := 'Host:';
  EditHost := TEdit.Create(DBPage); EditHost.Parent := DBPage.Surface; EditHost.Left := 120; EditHost.Top := lblHost.Top - 2; EditHost.Width := DBPage.SurfaceWidth - 120; EditHost.Text := 'localhost';

  lblPort := TLabel.Create(DBPage); lblPort.Parent := DBPage.Surface; lblPort.Left := 0; lblPort.Top := EditHost.Top + 32; lblPort.Caption := 'Port:';
  EditPort := TEdit.Create(DBPage); EditPort.Parent := DBPage.Surface; EditPort.Left := 120; EditPort.Top := lblPort.Top - 2; EditPort.Width := 100; EditPort.Text := '3306';

  lblDBName := TLabel.Create(DBPage); lblDBName.Parent := DBPage.Surface; lblDBName.Left := 0; lblDBName.Top := EditPort.Top + 32; lblDBName.Caption := 'Database:';
  EditName := TEdit.Create(DBPage); EditName.Parent := DBPage.Surface; EditName.Left := 120; EditName.Top := lblDBName.Top - 2; EditName.Width := DBPage.SurfaceWidth - 120; EditName.Text := 'saidb';

  // Credentials header
  lblCred := TLabel.Create(DBPage); lblCred.Parent := DBPage.Surface; lblCred.Left := 0; lblCred.Top := EditName.Top + 40; lblCred.Caption := 'Credentials'; lblCred.Font.Style := [fsBold];
  lblUser := TLabel.Create(DBPage); lblUser.Parent := DBPage.Surface; lblUser.Left := 0; lblUser.Top := lblCred.Top + 24; lblUser.Caption := 'User:';
  EditUser := TEdit.Create(DBPage); EditUser.Parent := DBPage.Surface; EditUser.Left := 120; EditUser.Top := lblUser.Top - 2; EditUser.Width := DBPage.SurfaceWidth - 120; EditUser.Text := 'doadmin';

  lblPass := TLabel.Create(DBPage); lblPass.Parent := DBPage.Surface; lblPass.Left := 0; lblPass.Top := EditUser.Top + 32; lblPass.Caption := 'Password:';
  EditPass := TEdit.Create(DBPage); EditPass.Parent := DBPage.Surface; EditPass.Left := 120; EditPass.Top := lblPass.Top - 2; EditPass.Width := DBPage.SurfaceWidth - 120; EditPass.PasswordChar := '*';

  // Security header
  lblSec := TLabel.Create(DBPage); lblSec.Parent := DBPage.Surface; lblSec.Left := 0; lblSec.Top := EditPass.Top + 40; lblSec.Caption := 'Security'; lblSec.Font.Style := [fsBold];
  CheckSsl := TCheckBox.Create(DBPage); CheckSsl.Parent := DBPage.Surface; CheckSsl.Left := 0; CheckSsl.Top := lblSec.Top + 24; CheckSsl.Caption := 'Use SSL for DB connection';
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


