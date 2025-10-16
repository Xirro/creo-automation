; Minimal canonical Inno Setup script for Creo Automation
[Setup]
AppName=Creo Automation
AppVersion=0.1.1
; Stable AppId so installer can detect previous installs reliably
AppId={{3F2504E0-4F89-11D3-9A0C-0305E82C3301}}
DefaultDirName={commonpf64}\CreoAutomation
DisableProgramGroupPage=yes
OutputDir=..\dist_installer
OutputBaseFilename=CreoAutomationInstaller
Compression=lzma

[Files]
Source: "..\dist\*"; DestDir: "{app}"; Flags: recursesubdirs createallsubdirs
Source: "desktop-launcher.ps1"; DestDir: "{app}\bin"; Flags: ignoreversion
Source: "creo-automation.ico"; DestDir: "{app}"; Flags: ignoreversion
Source: "create-desktop-shortcut.ps1"; DestDir: "{app}"; Flags: ignoreversion

[Tasks]
Name: "desktopicon"; Description: "Create a desktop icon"; GroupDescription: "Additional icons:"

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
  Check: IsTaskSelected('desktopicon'); Flags: postinstall runhidden skipifsilent; Description: "Create desktop shortcut"; StatusMsg: "Creating desktop shortcut"

[UninstallRun]
Filename: "{app}\bin\register-service.cmd"; Parameters: "remove"; Flags: runhidden; RunOnceId: "UnregisterCreoAutomationService"

[Code]
function UninstallPreviousInstall(): Boolean; forward;

function InitializeSetup(): Boolean;
begin
  // Attempt to silently uninstall any existing Creo Automation installation
  Result := True;
  try
    if UninstallPreviousInstall() then
    begin
      // give a short pause so previous uninstall completes file handle cleanup
      Sleep(800);
    end;
  except
    // don't block install on any uninstall errors; log if possible
  end;
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

// -- Uninstall helper functions -------------------------------------------------
function TrimQuotes(const S: String): String;
begin
  Result := S;
  if (Length(Result) >= 2) and (Result[1] = '"') and (Result[Length(Result)] = '"') then
    Result := Copy(Result, 2, Length(Result)-2);
end;

function ParseCommand(const Cmd: String; var ExePath, Params: String): Boolean;
var
  p: Integer;
  s: String;
begin
  Result := False;
  ExePath := '';
  Params := '';
  s := Trim(Cmd);
  if s = '' then Exit;
  if s[1] = '"' then
  begin
    p := Pos('"', Copy(s, 2, MaxInt));
    if p > 0 then
    begin
      ExePath := Copy(s, 2, p-1);
      Params := Trim(Copy(s, p+2, MaxInt));
      Result := True;
      Exit;
    end;
  end;
  p := Pos(' ', s);
  if p > 0 then
  begin
    ExePath := Copy(s, 1, p-1);
    Params := Trim(Copy(s, p+1, MaxInt));
  end else
  begin
    ExePath := s;
    Params := '';
  end;
  Result := True;
end;

function FindUninstallStringInRoot(Root: Integer; const DisplayName: String): String;
var
  Subkeys: TStrings;
  i: Integer;
  KeyPath, val: String;
begin
  Result := '';
  Subkeys := TStringList.Create;
  try
    if RegGetSubkeyNames(Root, 'SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall', Subkeys) then
    begin
      for i := 0 to Subkeys.Count - 1 do
      begin
        KeyPath := 'SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\' + Subkeys[i];
        if RegQueryStringValue(Root, KeyPath, 'DisplayName', val) then
        begin
          if val = DisplayName then
          begin
            if RegQueryStringValue(Root, KeyPath, 'UninstallString', Result) then Exit;
          end;
        end;
      end;
    end;
  finally
    Subkeys.Free;
  end;
end;

function FindUninstallString(const DisplayName: String): String;
begin
  // search common locations: HKLM and HKCU, and wow6432node fallback
  Result := FindUninstallStringInRoot(HKLM, DisplayName);
  if Result <> '' then Exit;
  // Try 32-bit view on 64-bit machines
  Result := FindUninstallStringInRoot(HKLM32, DisplayName);
  if Result <> '' then Exit;
  Result := FindUninstallStringInRoot(HKCU, DisplayName);
  if Result <> '' then Exit;
  Result := FindUninstallStringInRoot(HKCU32, DisplayName);
end;

function ExecCommandSilent(const CmdLine: String): Boolean;
var
  Exe, Params: String;
  ResultCode: Integer;
  GuidStart, GuidEnd: Integer;
  Guid: String;
begin
  Result := False;
  if not ParseCommand(CmdLine, Exe, Params) then Exit;

  // handle MSI uninstall commands specially if present
  if (Pos('msiexec', Lowercase(Exe)) > 0) or (Pos('msiexec', Lowercase(CmdLine)) > 0) then
  begin
    // attempt to extract GUID from command line
    Guid := '';
    GuidStart := Pos('{', CmdLine);
    GuidEnd := Pos('}', CmdLine);
    if (GuidStart > 0) and (GuidEnd > GuidStart) then
    begin
      Guid := Copy(CmdLine, GuidStart, GuidEnd - GuidStart + 1);
      if Guid <> '' then
      begin
        Exec(ExpandConstant('{cmd}'), '/C msiexec /x ' + Guid + ' /qn /norestart', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
        Result := (ResultCode = 0);
        Exit;
      end;
    end;
    // fallback: run provided msiexec command line silently
    Exec(Exe, Params + ' /qn /norestart', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
    Result := (ResultCode = 0);
    Exit;
  end;

  // For other uninstallers (Inno/NSIS/etc), try common silent flags
  // Prefer: /VERYSILENT /SUPPRESSMSGBOXES /NORESTART (Inno)
  if Exec(Exe, Params + ' /VERYSILENT /SUPPRESSMSGBOXES /NORESTART', '', SW_HIDE, ewWaitUntilTerminated, ResultCode) then
  begin
    Result := (ResultCode = 0);
    Exit;
  end;

  // fallback: execute the uninstall command line via cmd /C
  if Exec(ExpandConstant('{cmd}'), '/C ' + CmdLine, '', SW_HIDE, ewWaitUntilTerminated, ResultCode) then
  begin
    Result := (ResultCode = 0);
    Exit;
  end;
end;

function UninstallPreviousInstall(): Boolean;
var
  UninstCmd: String;
  DisplayName: String;
  ok: Boolean;
begin
  Result := False;
  DisplayName := ExpandConstant('{#SetupSetting("AppName")}');
  if DisplayName = '' then DisplayName := 'Creo Automation';

  // Try to find uninstall string
  UninstCmd := FindUninstallString(DisplayName);
  if UninstCmd = '' then
  begin
    // nothing found
    Log('No previous Creo Automation uninstall entry found.');
    Exit(False);
  end;

  Log('Found uninstall command: ' + UninstCmd);
  ok := ExecCommandSilent(UninstCmd);
  if not ok then
  begin
    Log('Silent uninstall failed for previous installation. Attempting visible uninstall...');
    // Attempt visible uninstall as fallback
    if not ParseCommand(UninstCmd, UninstCmd, UninstCmd) then ; // noop - keep original string
    if Exec(ExpandConstant('{cmd}'), '/C ' + UninstCmd, '', SW_SHOW, ewWaitUntilTerminated, ResultCode) then
    begin
      Result := (ResultCode = 0);
    end else
      Result := False;
  end else
    Result := True;
end;


