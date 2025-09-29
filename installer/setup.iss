; Creo Automation installer - single clean script
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
  Parameters: "-NoProfile -ExecutionPolicy Bypass -File \"\"{app}\\scripts\\postinstall-config.ps1\"\" -Ini \"\"{app}\\dbinstaller.ini\"\" -InstallDir \"\"{app}\"\""; \
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
  EditHost, EditPort, EditName, EditUser, EditPass, EditSvc: TEdit;
  LabelHost, LabelPort, LabelName, LabelUser, LabelPass, LabelSvc: TLabel;
  HintHost, HintPort, HintName, HintUser, HintPass, HintSvc: TNewStaticText;
  CheckSsl: TCheckBox;
  TestBtn: TButton;

procedure CreateDBPage();
var y: Integer;
begin
  DBPage := CreateCustomPage(wpSelectDir, 'Database Configuration', 'Enter database connection details');
  WizardForm.ShowHint := True;
  y := 8;

  LabelHost := TLabel.Create(DBPage);
  LabelHost.Parent := DBPage.Surface;
  LabelHost.Left := 0; LabelHost.Top := y; LabelHost.Caption := 'Database host:';
  EditHost := TEdit.Create(DBPage);
  EditHost.Parent := DBPage.Surface; EditHost.Left := 0; EditHost.Top := y + 18; EditHost.Width := DBPage.SurfaceWidth; EditHost.Text := 'localhost'; EditHost.Hint := 'Hostname or IP'; EditHost.ShowHint := True;
  HintHost := TNewStaticText.Create(DBPage); HintHost.Parent := DBPage.Surface; HintHost.Left := 4; HintHost.Top := EditHost.Top + 24; HintHost.Width := DBPage.SurfaceWidth; HintHost.Caption := 'e.g. db.example.com or localhost'; y := HintHost.Top + 26;

  LabelPort := TLabel.Create(DBPage); LabelPort.Parent := DBPage.Surface; LabelPort.Left := 0; LabelPort.Top := y; LabelPort.Caption := 'Database port:';
  EditPort := TEdit.Create(DBPage); EditPort.Parent := DBPage.Surface; EditPort.Left := 0; EditPort.Top := y + 18; EditPort.Width := DBPage.SurfaceWidth; EditPort.Text := '3306'; EditPort.Hint := 'TCP port (default 3306)'; EditPort.ShowHint := True;
  HintPort := TNewStaticText.Create(DBPage); HintPort.Parent := DBPage.Surface; HintPort.Left := 4; HintPort.Top := EditPort.Top + 24; HintPort.Width := DBPage.SurfaceWidth; HintPort.Caption := 'Default MySQL port is 3306'; y := HintPort.Top + 26;

  LabelName := TLabel.Create(DBPage); LabelName.Parent := DBPage.Surface; LabelName.Left := 0; LabelName.Top := y; LabelName.Caption := 'Database name:';
  EditName := TEdit.Create(DBPage); EditName.Parent := DBPage.Surface; EditName.Left := 0; EditName.Top := y + 18; EditName.Width := DBPage.SurfaceWidth; EditName.Text := 'saidb'; EditName.Hint := 'Database/schema name'; EditName.ShowHint := True;
  HintName := TNewStaticText.Create(DBPage); HintName.Parent := DBPage.Surface; HintName.Left := 4; HintName.Top := EditName.Top + 24; HintName.Width := DBPage.SurfaceWidth; HintName.Caption := 'Leave as ''saidb'' for production'; y := HintName.Top + 26;

  LabelUser := TLabel.Create(DBPage); LabelUser.Parent := DBPage.Surface; LabelUser.Left := 0; LabelUser.Top := y; LabelUser.Caption := 'Database user:';
  EditUser := TEdit.Create(DBPage); EditUser.Parent := DBPage.Surface; EditUser.Left := 0; EditUser.Top := y + 18; EditUser.Width := DBPage.SurfaceWidth; EditUser.Text := 'doadmin'; EditUser.Hint := 'DB username'; EditUser.ShowHint := True;
  HintUser := TNewStaticText.Create(DBPage); HintUser.Parent := DBPage.Surface; HintUser.Left := 4; HintUser.Top := EditUser.Top + 24; HintUser.Width := DBPage.SurfaceWidth; HintUser.Caption := 'Account used by the application to connect'; y := HintUser.Top + 26;

  LabelPass := TLabel.Create(DBPage); LabelPass.Parent := DBPage.Surface; LabelPass.Left := 0; LabelPass.Top := y; LabelPass.Caption := 'Database password:';
  EditPass := TEdit.Create(DBPage); EditPass.Parent := DBPage.Surface; EditPass.Left := 0; EditPass.Top := y + 18; EditPass.Width := DBPage.SurfaceWidth; EditPass.PasswordChar := '*'; EditPass.Hint := 'Password for the database user'; EditPass.ShowHint := True;
  HintPass := TNewStaticText.Create(DBPage); HintPass.Parent := DBPage.Surface; HintPass.Left := 4; HintPass.Top := EditPass.Top + 24; HintPass.Width := DBPage.SurfaceWidth; HintPass.Caption := 'Password will be written to the local config file (ignored by Git)'; y := HintPass.Top + 26;

  CheckSsl := TCheckBox.Create(DBPage); CheckSsl.Parent := DBPage.Surface; CheckSsl.Left := 0; CheckSsl.Top := y; CheckSsl.Caption := 'Use SSL for DB connection'; y := y + 28;

  LabelSvc := TLabel.Create(DBPage); LabelSvc.Parent := DBPage.Surface; LabelSvc.Left := 0; LabelSvc.Top := y; LabelSvc.Caption := 'Service account (optional):';
  EditSvc := TEdit.Create(DBPage); EditSvc.Parent := DBPage.Surface; EditSvc.Left := 0; EditSvc.Top := y + 18; EditSvc.Width := DBPage.SurfaceWidth; EditSvc.Hint := 'Optional service account name, e.g. DOMAIN\\svcUser'; EditSvc.ShowHint := True;
  HintSvc := TNewStaticText.Create(DBPage); HintSvc.Parent := DBPage.Surface; HintSvc.Left := 4; HintSvc.Top := EditSvc.Top + 24; HintSvc.Width := DBPage.SurfaceWidth; HintSvc.Caption := 'If provided, ACLs on the encrypted password will allow this account to read it.'; y := HintSvc.Top + 26;

  TestBtn := TButton.Create(DBPage); TestBtn.Parent := DBPage.Surface; TestBtn.Left := DBPage.SurfaceWidth - 140; TestBtn.Top := y; TestBtn.Width := 130; TestBtn.Caption := 'Test connection'; TestBtn.OnClick := @TestBtnClick;
end;

procedure TestBtnClick(Sender: TObject);
var
  Host, Port, TmpFile, ReadResult, Cmd: string;
  ResultCode: Integer;
begin
  Host := Trim(EditHost.Text);
  Port := Trim(EditPort.Text);
  if Host = '' then begin MsgBox('Please enter a host before testing the connection.', mbError, MB_OK); exit; end;
  if Port = '' then begin MsgBox('Please enter a port before testing the connection.', mbError, MB_OK); exit; end;

  TmpFile := ExpandConstant('{tmp}\dbtest.txt');
  Cmd := 'powershell -NoProfile -Command "'
    + 'try { $r = Test-NetConnection -ComputerName \'' + Host + '\' -Port ' + Port + ' -WarningAction SilentlyContinue; '
    + 'if ($r -and $r.TcpTestSucceeded) { Out-File -FilePath \'' + TmpFile + '\' -Encoding UTF8 -InputObject \'' + 'SUCCESS' + '\' } else { Out-File -FilePath \'' + TmpFile + '\' -Encoding UTF8 -InputObject \'' + 'FAIL' + '\' } } catch { '
    + 'try { $s = New-Object System.Net.Sockets.TcpClient; $s.Connect(\'' + Host + '\', ' + Port + '); $s.Close(); Out-File -FilePath \'' + TmpFile + '\' -Encoding UTF8 -InputObject \'' + 'SUCCESS' + '\' } catch { Out-File -FilePath \'' + TmpFile + '\' -Encoding UTF8 -InputObject \'' + 'FAIL' + '\' } }"';

  if Exec(Cmd, '', '', SW_HIDE, ewWaitUntilTerminated, ResultCode) then
  begin
    if LoadStringFromFile(TmpFile, ReadResult) then
    begin
      if Trim(ReadResult) = 'SUCCESS' then
        MsgBox('Connection test succeeded: ' + Host + ':' + Port, mbInformation, MB_OK)
      else
        MsgBox('Connection test failed: ' + Host + ':' + Port, mbError, MB_OK);
      DeleteFile(TmpFile);
    end else
      MsgBox('Connection test finished but result file could not be read.', mbInformation, MB_OK);
  end else
    MsgBox('Failed to run connection test command.', mbError, MB_OK);
end;

function NextButtonClick(CurPageID: Integer): Boolean;
begin
  Result := True;
  if CurPageID = DBPage.ID then
  begin
    if Trim(EditHost.Text) = '' then begin MsgBox('Please enter a database host (e.g. db.example.com or localhost).', mbError, MB_OK); Result := False; exit; end;
    if Trim(EditPort.Text) = '' then begin MsgBox('Please enter a database port (e.g. 3306).', mbError, MB_OK); Result := False; exit; end;
    try StrToInt(Trim(EditPort.Text)); except MsgBox('Port must be a number (e.g. 3306).', mbError, MB_OK); Result := False; exit; end;
    if Trim(EditUser.Text) = '' then begin MsgBox('Please enter a database user.', mbError, MB_OK); Result := False; exit; end;

    SetIniString('DB', 'Host', EditHost.Text, ExpandConstant('{app}\dbinstaller.ini'));
    SetIniString('DB', 'Port', EditPort.Text, ExpandConstant('{app}\dbinstaller.ini'));
    SetIniString('DB', 'Name', EditName.Text, ExpandConstant('{app}\dbinstaller.ini'));
    SetIniString('DB', 'User', EditUser.Text, ExpandConstant('{app}\dbinstaller.ini'));
    SetIniString('DB', 'Pass', EditPass.Text, ExpandConstant('{app}\dbinstaller.ini'));
    SetIniString('DB', 'ServiceAccount', EditSvc.Text, ExpandConstant('{app}\dbinstaller.ini'));
    if CheckSsl.Checked then SetIniString('DB', 'Ssl', '1', ExpandConstant('{app}\dbinstaller.ini')) else SetIniString('DB', 'Ssl', '0', ExpandConstant('{app}\dbinstaller.ini'));
  end;
end;

procedure InitializeWizard();
begin
  CreateDBPage();
end;

function GetIniString(const Section, Key, Filename: string): string;
var Buf: string;
begin
  Buf := ExpandConstant(Filename);
  if FileExists(Buf) then Result := GetIniStringFromFile(Section, Key, '', Buf) else Result := '';
end;

function IfThen(Cond: Boolean; const TrueVal, FalseVal: string): string;
begin if Cond then Result := TrueVal else Result := FalseVal; end;
; Inno Setup script for Creo Automation (single clean copy)
[Setup]
AppName=Creo Automation
AppVersion=1.0.0
DefaultDirName={commonpf64}\CreoAutomation
; Single, cleaned Inno Setup script for Creo Automation
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
; Run postinstall config with the INI generated by the installer wizard (if present)
Filename: "{win}\system32\WindowsPowerShell\v1.0\powershell.exe"; \
  Parameters: "-NoProfile -ExecutionPolicy Bypass -File \"\"{app}\\scripts\\postinstall-config.ps1\"\" -Ini \"\"{app}\\dbinstaller.ini\"\" -InstallDir \"\"{app}\"\""; \
  Flags: postinstall waituntilterminated; Description: "Post-install DB configuration"; StatusMsg: "Configuring database settings"

; Start the app once after install
Filename: "{app}\bin\run-app.bat"; Description: "Start Creo Automation"; Flags: nowait postinstall skipifsilent

; Optionally register service via bundled helper
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
  EditHost, EditPort, EditName, EditUser, EditPass, EditSvc: TEdit;
  LabelHost, LabelPort, LabelName, LabelUser, LabelPass, LabelSvc: TLabel;
  HintHost, HintPort, HintName, HintUser, HintPass, HintSvc: TNewStaticText;
  CheckSsl: TCheckBox;
  TestBtn: TButton;

procedure CreateDBPage();
var y: Integer;
begin
  DBPage := CreateCustomPage(wpSelectDir, 'Database Configuration', 'Enter database connection details');
  WizardForm.ShowHint := True;
  y := 8;

  LabelHost := TLabel.Create(DBPage);
  LabelHost.Parent := DBPage.Surface;
  LabelHost.Left := 0; LabelHost.Top := y; LabelHost.Caption := 'Database host:';
  EditHost := TEdit.Create(DBPage);
  EditHost.Parent := DBPage.Surface; EditHost.Left := 0; EditHost.Top := y + 18; EditHost.Width := DBPage.SurfaceWidth; EditHost.Text := 'localhost'; EditHost.Hint := 'Hostname or IP'; EditHost.ShowHint := True;
  HintHost := TNewStaticText.Create(DBPage); HintHost.Parent := DBPage.Surface; HintHost.Left := 4; HintHost.Top := EditHost.Top + 24; HintHost.Width := DBPage.SurfaceWidth; HintHost.Caption := 'e.g. db.example.com or localhost'; y := HintHost.Top + 26;

  LabelPort := TLabel.Create(DBPage); LabelPort.Parent := DBPage.Surface; LabelPort.Left := 0; LabelPort.Top := y; LabelPort.Caption := 'Database port:';
  EditPort := TEdit.Create(DBPage); EditPort.Parent := DBPage.Surface; EditPort.Left := 0; EditPort.Top := y + 18; EditPort.Width := DBPage.SurfaceWidth; EditPort.Text := '3306'; EditPort.Hint := 'TCP port (default 3306)'; EditPort.ShowHint := True;
  HintPort := TNewStaticText.Create(DBPage); HintPort.Parent := DBPage.Surface; HintPort.Left := 4; HintPort.Top := EditPort.Top + 24; HintPort.Width := DBPage.SurfaceWidth; HintPort.Caption := 'Default MySQL port is 3306'; y := HintPort.Top + 26;

  LabelName := TLabel.Create(DBPage); LabelName.Parent := DBPage.Surface; LabelName.Left := 0; LabelName.Top := y; LabelName.Caption := 'Database name:';
  EditName := TEdit.Create(DBPage); EditName.Parent := DBPage.Surface; EditName.Left := 0; EditName.Top := y + 18; EditName.Width := DBPage.SurfaceWidth; EditName.Text := 'saidb'; EditName.Hint := 'Database/schema name'; EditName.ShowHint := True;
  HintName := TNewStaticText.Create(DBPage); HintName.Parent := DBPage.Surface; HintName.Left := 4; HintName.Top := EditName.Top + 24; HintName.Width := DBPage.SurfaceWidth; HintName.Caption := 'Leave as ''saidb'' for production'; y := HintName.Top + 26;

  LabelUser := TLabel.Create(DBPage); LabelUser.Parent := DBPage.Surface; LabelUser.Left := 0; LabelUser.Top := y; LabelUser.Caption := 'Database user:';
  EditUser := TEdit.Create(DBPage); EditUser.Parent := DBPage.Surface; EditUser.Left := 0; EditUser.Top := y + 18; EditUser.Width := DBPage.SurfaceWidth; EditUser.Text := 'doadmin'; EditUser.Hint := 'DB username'; EditUser.ShowHint := True;
  HintUser := TNewStaticText.Create(DBPage); HintUser.Parent := DBPage.Surface; HintUser.Left := 4; HintUser.Top := EditUser.Top + 24; HintUser.Width := DBPage.SurfaceWidth; HintUser.Caption := 'Account used by the application to connect'; y := HintUser.Top + 26;

  LabelPass := TLabel.Create(DBPage); LabelPass.Parent := DBPage.Surface; LabelPass.Left := 0; LabelPass.Top := y; LabelPass.Caption := 'Database password:';
  EditPass := TEdit.Create(DBPage); EditPass.Parent := DBPage.Surface; EditPass.Left := 0; EditPass.Top := y + 18; EditPass.Width := DBPage.SurfaceWidth; EditPass.PasswordChar := '*'; EditPass.Hint := 'Password for the database user'; EditPass.ShowHint := True;
  HintPass := TNewStaticText.Create(DBPage); HintPass.Parent := DBPage.Surface; HintPass.Left := 4; HintPass.Top := EditPass.Top + 24; HintPass.Width := DBPage.SurfaceWidth; HintPass.Caption := 'Password will be written to the local config file (ignored by Git)'; y := HintPass.Top + 26;

  CheckSsl := TCheckBox.Create(DBPage); CheckSsl.Parent := DBPage.Surface; CheckSsl.Left := 0; CheckSsl.Top := y; CheckSsl.Caption := 'Use SSL for DB connection'; y := y + 28;

  LabelSvc := TLabel.Create(DBPage); LabelSvc.Parent := DBPage.Surface; LabelSvc.Left := 0; LabelSvc.Top := y; LabelSvc.Caption := 'Service account (optional):';
  EditSvc := TEdit.Create(DBPage); EditSvc.Parent := DBPage.Surface; EditSvc.Left := 0; EditSvc.Top := y + 18; EditSvc.Width := DBPage.SurfaceWidth; EditSvc.Hint := 'Optional service account name, e.g. DOMAIN\\svcUser'; EditSvc.ShowHint := True;
  HintSvc := TNewStaticText.Create(DBPage); HintSvc.Parent := DBPage.Surface; HintSvc.Left := 4; HintSvc.Top := EditSvc.Top + 24; HintSvc.Width := DBPage.SurfaceWidth; HintSvc.Caption := 'If provided, ACLs on the encrypted password will allow this account to read it.'; y := HintSvc.Top + 26;

  TestBtn := TButton.Create(DBPage); TestBtn.Parent := DBPage.Surface; TestBtn.Left := DBPage.SurfaceWidth - 140; TestBtn.Top := y; TestBtn.Width := 130; TestBtn.Caption := 'Test connection'; TestBtn.OnClick := @TestBtnClick;
end;

procedure TestBtnClick(Sender: TObject);
var
  Host, Port, TmpFile, ReadResult, Cmd: string;
  ResultCode: Integer;
begin
  Host := Trim(EditHost.Text);
  Port := Trim(EditPort.Text);
  if Host = '' then begin MsgBox('Please enter a host before testing the connection.', mbError, MB_OK); exit; end;
  if Port = '' then begin MsgBox('Please enter a port before testing the connection.', mbError, MB_OK); exit; end;

  TmpFile := ExpandConstant('{tmp}\dbtest.txt');
  Cmd := 'powershell -NoProfile -Command "'
    + 'try { $r = Test-NetConnection -ComputerName \'' + Host + '\' -Port ' + Port + ' -WarningAction SilentlyContinue; '
    + 'if ($r -and $r.TcpTestSucceeded) { Out-File -FilePath \'' + TmpFile + '\' -Encoding UTF8 -InputObject \'' + 'SUCCESS' + '\' } else { Out-File -FilePath \'' + TmpFile + '\' -Encoding UTF8 -InputObject \'' + 'FAIL' + '\' } } catch { '
    + 'try { $s = New-Object System.Net.Sockets.TcpClient; $s.Connect(\'' + Host + '\', ' + Port + '); $s.Close(); Out-File -FilePath \'' + TmpFile + '\' -Encoding UTF8 -InputObject \'' + 'SUCCESS' + '\' } catch { Out-File -FilePath \'' + TmpFile + '\' -Encoding UTF8 -InputObject \'' + 'FAIL' + '\' } }"';

  if Exec(Cmd, '', '', SW_HIDE, ewWaitUntilTerminated, ResultCode) then
  begin
    if LoadStringFromFile(TmpFile, ReadResult) then
    begin
      if Trim(ReadResult) = 'SUCCESS' then
        MsgBox('Connection test succeeded: ' + Host + ':' + Port, mbInformation, MB_OK)
      else
        MsgBox('Connection test failed: ' + Host + ':' + Port, mbError, MB_OK);
      DeleteFile(TmpFile);
    end else
      MsgBox('Connection test finished but result file could not be read.', mbInformation, MB_OK);
  end else
    MsgBox('Failed to run connection test command.', mbError, MB_OK);
end;

function NextButtonClick(CurPageID: Integer): Boolean;
begin
  Result := True;
  if CurPageID = DBPage.ID then
  begin
    if Trim(EditHost.Text) = '' then begin MsgBox('Please enter a database host (e.g. db.example.com or localhost).', mbError, MB_OK); Result := False; exit; end;
    if Trim(EditPort.Text) = '' then begin MsgBox('Please enter a database port (e.g. 3306).', mbError, MB_OK); Result := False; exit; end;
    try StrToInt(Trim(EditPort.Text)); except MsgBox('Port must be a number (e.g. 3306).', mbError, MB_OK); Result := False; exit; end;
    if Trim(EditUser.Text) = '' then begin MsgBox('Please enter a database user.', mbError, MB_OK); Result := False; exit; end;

    SetIniString('DB', 'Host', EditHost.Text, ExpandConstant('{app}\dbinstaller.ini'));
    SetIniString('DB', 'Port', EditPort.Text, ExpandConstant('{app}\dbinstaller.ini'));
    SetIniString('DB', 'Name', EditName.Text, ExpandConstant('{app}\dbinstaller.ini'));
    SetIniString('DB', 'User', EditUser.Text, ExpandConstant('{app}\dbinstaller.ini'));
    SetIniString('DB', 'Pass', EditPass.Text, ExpandConstant('{app}\dbinstaller.ini'));
    SetIniString('DB', 'ServiceAccount', EditSvc.Text, ExpandConstant('{app}\dbinstaller.ini'));
    if CheckSsl.Checked then SetIniString('DB', 'Ssl', '1', ExpandConstant('{app}\dbinstaller.ini')) else SetIniString('DB', 'Ssl', '0', ExpandConstant('{app}\dbinstaller.ini'));
  end;
end;

procedure InitializeWizard();
begin
  CreateDBPage();
end;

function GetIniString(const Section, Key, Filename: string): string;
var Buf: string;
begin
  Buf := ExpandConstant(Filename);
  if FileExists(Buf) then Result := GetIniStringFromFile(Section, Key, '', Buf) else Result := '';
end;

function IfThen(Cond: Boolean; const TrueVal, FalseVal: string): string;
begin if Cond then Result := TrueVal else Result := FalseVal; end;
    LabelUser := TLabel.Create(DBPage); LabelUser.Parent := DBPage.Surface; LabelUser.Left := 0; LabelUser.Top := y; LabelUser.Caption := 'Database user:';
    EditUser := TEdit.Create(DBPage); EditUser.Parent := DBPage.Surface; EditUser.Left := 0; EditUser.Top := y + 18; EditUser.Width := DBPage.SurfaceWidth; EditUser.Text := 'doadmin'; EditUser.Hint := 'DB username'; EditUser.ShowHint := True;
    HintUser := TNewStaticText.Create(DBPage); HintUser.Parent := DBPage.Surface; HintUser.Left := 4; HintUser.Top := EditUser.Top + 24; HintUser.Width := DBPage.SurfaceWidth; HintUser.Caption := 'Account used by the application to connect'; y := HintUser.Top + 26;

    LabelPass := TLabel.Create(DBPage); LabelPass.Parent := DBPage.Surface; LabelPass.Left := 0; LabelPass.Top := y; LabelPass.Caption := 'Database password:';
    EditPass := TEdit.Create(DBPage); EditPass.Parent := DBPage.Surface; EditPass.Left := 0; EditPass.Top := y + 18; EditPass.Width := DBPage.SurfaceWidth; EditPass.PasswordChar := '*'; EditPass.Hint := 'Password for the database user'; EditPass.ShowHint := True;
    HintPass := TNewStaticText.Create(DBPage); HintPass.Parent := DBPage.Surface; HintPass.Left := 4; HintPass.Top := EditPass.Top + 24; HintPass.Width := DBPage.SurfaceWidth; HintPass.Caption := 'Password will be written to the local config file (ignored by Git)'; y := HintPass.Top + 26;

    CheckSsl := TCheckBox.Create(DBPage); CheckSsl.Parent := DBPage.Surface; CheckSsl.Left := 0; CheckSsl.Top := y; CheckSsl.Caption := 'Use SSL for DB connection'; y := y + 28;

    LabelSvc := TLabel.Create(DBPage); LabelSvc.Parent := DBPage.Surface; LabelSvc.Left := 0; LabelSvc.Top := y; LabelSvc.Caption := 'Service account (optional):';
    EditSvc := TEdit.Create(DBPage); EditSvc.Parent := DBPage.Surface; EditSvc.Left := 0; EditSvc.Top := y + 18; EditSvc.Width := DBPage.SurfaceWidth; EditSvc.Hint := 'Optional service account name, e.g. DOMAIN\svcUser'; EditSvc.ShowHint := True;
    HintSvc := TNewStaticText.Create(DBPage); HintSvc.Parent := DBPage.Surface; HintSvc.Left := 4; HintSvc.Top := EditSvc.Top + 24; HintSvc.Width := DBPage.SurfaceWidth; HintSvc.Caption := 'If provided, ACLs on the encrypted password will allow this account to read it.'; y := HintSvc.Top + 26;

    TestBtn := TButton.Create(DBPage); TestBtn.Parent := DBPage.Surface; TestBtn.Left := DBPage.SurfaceWidth - 140; TestBtn.Top := y; TestBtn.Width := 130; TestBtn.Caption := 'Test connection'; TestBtn.OnClick := @TestBtnClick;
  end;

  procedure TestBtnClick(Sender: TObject);
  var
    Host, Port, Cmd, TmpFile, ReadResult: string;
    ResultCode: Integer;
  begin
    Host := Trim(EditHost.Text);
    Port := Trim(EditPort.Text);
    if Host = '' then begin MsgBox('Please enter a host before testing the connection.', mbError, MB_OK); exit; end;
    if Port = '' then begin MsgBox('Please enter a port before testing the connection.', mbError, MB_OK); exit; end;

    TmpFile := ExpandConstant('{tmp}\dbtest.txt');
    Cmd := 'powershell -NoProfile -Command "'
      + 'try { $node = \"' + ExpandConstant('{app}') + '\\node\\node.exe\"; if (-not (Test-Path $node)) { $node = \"node\" } ; '
      + '$args = @(''' + ' --host ''',''' + Host + ''' , '' --port ''',''' + Port + ''' , '' --user ''',''' + EditUser.Text + ''' , '' --password ''',''' + EditPass.Text + ''' , '' --name ''',''' + EditName.Text + ''' , '' --ssl ''',''' + (IfThen(CheckSsl.Checked, '1','0')) + ''' ) ; '
      + '$args = $args -join " "; '
      + '$p = Start-Process -FilePath $node -ArgumentList $args -NoNewWindow -Wait -PassThru -RedirectStandardOutput \"' + TmpFile + '\" -RedirectStandardError \"' + TmpFile + '\"; '
      + 'if ($p.ExitCode -eq 0) { Write-Output \"SUCCESS\" } else { Write-Output \"FAIL\" } } catch { Write-Output \"FAIL\" }"';

    if Exec(Cmd, '', '', SW_HIDE, ewWaitUntilTerminated, ResultCode) then
    begin
      if LoadStringFromFile(TmpFile, ReadResult) then
      begin
        if Pos('SUCCESS', ReadResult) > 0 then
          MsgBox('Connection test succeeded: ' + Host + ':' + Port, mbInformation, MB_OK)
        else
          MsgBox('Connection test failed: ' + Host + ':' + Port + '\nDetails: ' + ReadResult, mbError, MB_OK);
        DeleteFile(TmpFile);
      end else
        MsgBox('Connection test finished but result file could not be read.', mbInformation, MB_OK);
    end else
      MsgBox('Failed to run connection test command.', mbError, MB_OK);
  end;

  function NextButtonClick(CurPageID: Integer): Boolean;
  begin
    Result := True;
    if CurPageID = DBPage.ID then
    begin
      if Trim(EditHost.Text) = '' then begin MsgBox('Please enter a database host (e.g. db.example.com or localhost).', mbError, MB_OK); Result := False; exit; end;
      if Trim(EditPort.Text) = '' then begin MsgBox('Please enter a database port (e.g. 3306).', mbError, MB_OK); Result := False; exit; end;
      try StrToInt(Trim(EditPort.Text)); except MsgBox('Port must be a number (e.g. 3306).', mbError, MB_OK); Result := False; exit; end;
      if Trim(EditUser.Text) = '' then begin MsgBox('Please enter a database user.', mbError, MB_OK); Result := False; exit; end;

      SetIniString('DB', 'Host', EditHost.Text, ExpandConstant('{app}\dbinstaller.ini'));
      SetIniString('DB', 'Port', EditPort.Text, ExpandConstant('{app}\dbinstaller.ini'));
      SetIniString('DB', 'Name', EditName.Text, ExpandConstant('{app}\dbinstaller.ini'));
      SetIniString('DB', 'User', EditUser.Text, ExpandConstant('{app}\dbinstaller.ini'));
      SetIniString('DB', 'Pass', EditPass.Text, ExpandConstant('{app}\dbinstaller.ini'));
      SetIniString('DB', 'ServiceAccount', EditSvc.Text, ExpandConstant('{app}\dbinstaller.ini'));
      if CheckSsl.Checked then SetIniString('DB', 'Ssl', '1', ExpandConstant('{app}\dbinstaller.ini')) else SetIniString('DB', 'Ssl', '0', ExpandConstant('{app}\dbinstaller.ini'));
    end;
  end;

  procedure InitializeWizard();
  begin
    CreateDBPage();
  end;

  function GetIniString(const Section, Key, Filename: string): string;
  var Buf: string;
  begin
    Buf := ExpandConstant(Filename);
    if FileExists(Buf) then Result := GetIniStringFromFile(Section, Key, '', Buf) else Result := '';
  end;

  function IfThen(Cond: Boolean; const TrueVal, FalseVal: string): string;
  begin if Cond then Result := TrueVal else Result := FalseVal; end;
    if Trim(EditHost.Text) = '' then
    begin
      MsgBox('Please enter a database host (e.g. db.example.com or localhost).', mbError, MB_OK);
      Result := False;
      exit;
    end;
    if Trim(EditPort.Text) = '' then
    begin
      MsgBox('Please enter a database port (e.g. 3306).', mbError, MB_OK);
      Result := False;
      exit;
    end;
    // Check numeric port
    try
      StrToInt(Trim(EditPort.Text));
    except
      MsgBox('Port must be a number (e.g. 3306).', mbError, MB_OK);
      Result := False;
      exit;
    end;
    if Trim(EditUser.Text) = '' then
    begin
      MsgBox('Please enter a database user.', mbError, MB_OK);
      Result := False;
      exit;
    end;

    SetIniString('DB', 'Host', EditHost.Text, ExpandConstant('{app}\dbinstaller.ini'));
    SetIniString('DB', 'Port', EditPort.Text, ExpandConstant('{app}\dbinstaller.ini'));
    SetIniString('DB', 'Name', EditName.Text, ExpandConstant('{app}\dbinstaller.ini'));
    SetIniString('DB', 'User', EditUser.Text, ExpandConstant('{app}\dbinstaller.ini'));
    SetIniString('DB', 'Pass', EditPass.Text, ExpandConstant('{app}\dbinstaller.ini'));
    SetIniString('DB', 'ServiceAccount', EditSvc.Text, ExpandConstant('{app}\dbinstaller.ini'));
    if CheckSsl.Checked then
      SetIniString('DB', 'Ssl', '1', ExpandConstant('{app}\dbinstaller.ini'))
    else
      SetIniString('DB', 'Ssl', '0', ExpandConstant('{app}\dbinstaller.ini'));
  end;
end;

procedure InitializeWizard();
begin
  CreateDBPage();
end;

// Helper to return an INI value so we can expand it in the Parameters field
function GetIniString(const Section, Key, Filename: string): string;
var
  Buf: string;
begin
  Buf := ExpandConstant(Filename);
  if FileExists(Buf) then
    Result := GetIniStringFromFile(Section, Key, '', Buf)
  else
    Result := '';
end;

// Helper used in Pascal string building
function IfThen(Cond: Boolean; const TrueVal, FalseVal: string): string;
begin
  if Cond then Result := TrueVal else Result := FalseVal;
end;
; Inno Setup script for Creo Automation
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
Source: "..\dist\*"; DestDir: "{app}"; Flags: recursesubdirs createallsubdirs

[Icons]
Name: "{group}\Creo Automation"; Filename: "{app}\bin\run-app.bat"

[Run]
; Run the post-install helper non-interactively with values collected on the custom page
Filename: "{win}\system32\WindowsPowerShell\v1.0\powershell.exe"; \
  Parameters: "-NoProfile -ExecutionPolicy Bypass -File \"\"{app}\\scripts\\postinstall-config.ps1\"\" -Ini \"\"{app}\\dbinstaller.ini\"\" -InstallDir \"\"{app}\"\""; \
  Flags: postinstall waituntilterminated; Description: "Post-install DB configuration"; StatusMsg: "Configuring database settings"

; Run the app (start once)
Filename: "{app}\bin\run-app.bat"; Description: "Start Creo Automation"; Flags: nowait postinstall skipifsilent

; Register service (via wrapper) after configuration
Filename: "{app}\bin\register-service.cmd"; Description: "Register CreoAutomation service"; Flags: runhidden postinstall skipifsilent; StatusMsg: "Configuring Windows service (CreoAutomation)"

[UninstallRun]
; Call the PowerShell helper to stop and remove the service during uninstall
Filename: "{app}\bin\register-service.cmd"; Parameters: "remove"; Flags: runhidden; RunOnceId: "UnregisterCreoAutomationService"

[Code]
function InitializeSetup(): Boolean;
begin
  Result := True;
end;

var
  DBPage: TWizardPage;
  EditHost, EditPort, EditName, EditUser, EditPass: TEdit;
  LabelHost, LabelPort, LabelName, LabelUser, LabelPass: TLabel;
  HintHost, HintPort, HintName, HintUser, HintPass: TNewStaticText;
  CheckSsl: TCheckBox;
  TestBtn: TButton;

procedure TestBtnClick(Sender: TObject);


procedure CreateDBPage();
begin
  DBPage := CreateCustomPage(wpSelectDir, 'Database Configuration', 'Enter database connection details');
  // Enable hints for the page
  WizardForm.ShowHint := True;

  // Layout variables
  var y: Integer;
  y := 8;

  // Host
  LabelHost := TLabel.Create(DBPage);
  LabelHost.Parent := DBPage.Surface;
  LabelHost.Left := 0; LabelHost.Top := y; LabelHost.Caption := 'Database host:';
  EditHost := TEdit.Create(DBPage);
  EditHost.Parent := DBPage.Surface;
  EditHost.Left := 0; EditHost.Top := y + 18; EditHost.Width := DBPage.SurfaceWidth;
  EditHost.Text := 'localhost';
  EditHost.Hint := 'Hostname or IP address of the MySQL server'; EditHost.ShowHint := True;
  HintHost := TNewStaticText.Create(DBPage);
  HintHost.Parent := DBPage.Surface; HintHost.Left := 4; HintHost.Top := EditHost.Top + 24; HintHost.Width := DBPage.SurfaceWidth; HintHost.Caption := 'e.g. db.example.com or localhost';
  y := HintHost.Top + 26;

  // Port
  LabelPort := TLabel.Create(DBPage);
  LabelPort.Parent := DBPage.Surface;
  LabelPort.Left := 0; LabelPort.Top := y; LabelPort.Caption := 'Database port:';
  EditPort := TEdit.Create(DBPage);
  EditPort.Parent := DBPage.Surface;
  EditPort.Left := 0; EditPort.Top := y + 18; EditPort.Width := DBPage.SurfaceWidth;
  EditPort.Text := '3306';
  EditPort.Hint := 'TCP port (default 3306)'; EditPort.ShowHint := True;
  HintPort := TNewStaticText.Create(DBPage);
  HintPort.Parent := DBPage.Surface; HintPort.Left := 4; HintPort.Top := EditPort.Top + 24; HintPort.Width := DBPage.SurfaceWidth; HintPort.Caption := 'Default MySQL port is 3306';
  y := HintPort.Top + 26;

  // Database name
  LabelName := TLabel.Create(DBPage);
  LabelName.Parent := DBPage.Surface;
  LabelName.Left := 0; LabelName.Top := y; LabelName.Caption := 'Database name:';
  EditName := TEdit.Create(DBPage);
  EditName.Parent := DBPage.Surface;
  EditName.Left := 0; EditName.Top := y + 18; EditName.Width := DBPage.SurfaceWidth;
  EditName.Text := 'saidb';
  EditName.Hint := 'Database/schema name to connect to'; EditName.ShowHint := True;
  HintName := TNewStaticText.Create(DBPage);
  HintName.Parent := DBPage.Surface; HintName.Left := 4; HintName.Top := EditName.Top + 24; HintName.Width := DBPage.SurfaceWidth; HintName.Caption := 'Leave as ''saidb'' for production';
  y := HintName.Top + 26;

  // User
  LabelUser := TLabel.Create(DBPage);
  LabelUser.Parent := DBPage.Surface;
  LabelUser.Left := 0; LabelUser.Top := y; LabelUser.Caption := 'Database user:';
  EditUser := TEdit.Create(DBPage);
  EditUser.Parent := DBPage.Surface;
  EditUser.Left := 0; EditUser.Top := y + 18; EditUser.Width := DBPage.SurfaceWidth;
  EditUser.Text := 'doadmin';
  EditUser.Hint := 'DB username'; EditUser.ShowHint := True;
  HintUser := TNewStaticText.Create(DBPage);
  HintUser.Parent := DBPage.Surface; HintUser.Left := 4; HintUser.Top := EditUser.Top + 24; HintUser.Width := DBPage.SurfaceWidth; HintUser.Caption := 'Account used by the application to connect';
  y := HintUser.Top + 26;

  // Password
  LabelPass := TLabel.Create(DBPage);
  LabelPass.Parent := DBPage.Surface;
  LabelPass.Left := 0; LabelPass.Top := y; LabelPass.Caption := 'Database password:';
  EditPass := TEdit.Create(DBPage);
  EditPass.Parent := DBPage.Surface;
  EditPass.Left := 0; EditPass.Top := y + 18; EditPass.Width := DBPage.SurfaceWidth;
  EditPass.PasswordChar := '*';
  EditPass.Hint := 'Password for the database user'; EditPass.ShowHint := True;
  HintPass := TNewStaticText.Create(DBPage);
  HintPass.Parent := DBPage.Surface; HintPass.Left := 4; HintPass.Top := EditPass.Top + 24; HintPass.Width := DBPage.SurfaceWidth; HintPass.Caption := 'Password will be written to the local config file (ignored by Git)';
  y := HintPass.Top + 26;

  CheckSsl := TCheckBox.Create(DBPage);
  CheckSsl.Parent := DBPage.Surface;
  CheckSsl.Left := 0; CheckSsl.Top := y; CheckSsl.Caption := 'Use SSL for DB connection';
  
  // Test Connection button
  TestBtn := TButton.Create(DBPage);
  TestBtn.Parent := DBPage.Surface;
  TestBtn.Left := DBPage.SurfaceWidth - 120; TestBtn.Top := y; TestBtn.Width := 110;
  TestBtn.Caption := 'Test connection';
  TestBtn.OnClick := @TestBtnClick;
end;

procedure TestBtnClick(Sender: TObject);
var
  Host, Port, Cmd, Output: string;
  ResultCode: Integer;
begin
  Host := Trim(EditHost.Text);
  Port := Trim(EditPort.Text);
  if Host = '' then
  begin
    MsgBox('Please enter a host before testing the connection.', mbError, MB_OK);
    exit;
  end;
  if Port = '' then
  begin
    MsgBox('Please enter a port before testing the connection.', mbError, MB_OK);
    exit;
  end;

  // Use PowerShell Test-NetConnection if available; fallback to PowerShell TCP client check
  var
    TmpFile: string;
    ReadResult: string;
  begin
    TmpFile := ExpandConstant('{tmp}\dbtest.txt');
    Cmd := 'powershell -NoProfile -Command "'
      + 'try { $r = Test-NetConnection -ComputerName \'' + Host + '\' -Port ' + Port + ' -WarningAction SilentlyContinue; '
      + 'if ($r -and $r.TcpTestSucceeded) { Out-File -FilePath \'' + TmpFile + '\' -Encoding UTF8 -InputObject \'' + 'SUCCESS' + '\' } else { Out-File -FilePath \'' + TmpFile + '\' -Encoding UTF8 -InputObject \'' + 'FAIL' + '\' } } catch { '
      + 'try { $s = New-Object System.Net.Sockets.TcpClient; $s.Connect(\'' + Host + '\', ' + Port + '); $s.Close(); Out-File -FilePath \'' + TmpFile + '\' -Encoding UTF8 -InputObject \'' + 'SUCCESS' + '\' } catch { Out-File -FilePath \'' + TmpFile + '\' -Encoding UTF8 -InputObject \'' + 'FAIL' + '\' } }"';

    if Exec(Cmd, '', '', SW_HIDE, ewWaitUntilTerminated, ResultCode) then
    begin
      if LoadStringFromFile(TmpFile, ReadResult) then
      begin
        if Trim(ReadResult) = 'SUCCESS' then
          MsgBox('Connection test succeeded: ' + Host + ':' + Port, mbInformation, MB_OK)
        else
          MsgBox('Connection test failed: ' + Host + ':' + Port, mbError, MB_OK);
      end else
        MsgBox('Connection test finished but result file could not be read.', mbInformation, MB_OK);
      DeleteFile(TmpFile);
    end else
      MsgBox('Failed to run connection test command.', mbError, MB_OK);
  end;
end;

function NextButtonClick(CurPageID: Integer): Boolean;
begin
  Result := True;
  if CurPageID = DBPage.ID then
  begin
    // Basic validation: host non-empty, port numeric, user non-empty
    if Trim(EditHost.Text) = '' then
    begin
      MsgBox('Please enter a database host (e.g. db.example.com or localhost).', mbError, MB_OK);
      Result := False;
      exit;
    end;
    if Trim(EditPort.Text) = '' then
    begin
      MsgBox('Please enter a database port (e.g. 3306).', mbError, MB_OK);
      Result := False;
      exit;
    end;
    // Check numeric port
    try
      StrToInt(Trim(EditPort.Text));
    except
      MsgBox('Port must be a number (e.g. 3306).', mbError, MB_OK);
      Result := False;
      exit;
    end;
    if Trim(EditUser.Text) = '' then
    begin
      MsgBox('Please enter a database user.', mbError, MB_OK);
      Result := False;
      exit;
    end;

    SetIniString('DB', 'Host', EditHost.Text, ExpandConstant('{app}\dbinstaller.ini'));
    SetIniString('DB', 'Port', EditPort.Text, ExpandConstant('{app}\dbinstaller.ini'));
    SetIniString('DB', 'Name', EditName.Text, ExpandConstant('{app}\dbinstaller.ini'));
    SetIniString('DB', 'User', EditUser.Text, ExpandConstant('{app}\dbinstaller.ini'));
    SetIniString('DB', 'Pass', EditPass.Text, ExpandConstant('{app}\dbinstaller.ini'));
    if CheckSsl.Checked then
      SetIniString('DB', 'Ssl', '1', ExpandConstant('{app}\dbinstaller.ini'))
    else
      SetIniString('DB', 'Ssl', '0', ExpandConstant('{app}\dbinstaller.ini'));
  end;
end;

procedure InitializeWizard();
begin
  CreateDBPage();
end;

// Helper to return an INI value so we can expand it in the Parameters field
function GetIniString(const Section, Key, Filename: string): string;
var
  Buf: string;
begin
  Buf := ExpandConstant(Filename);
  if FileExists(Buf) then
    Result := GetIniStringFromFile(Section, Key, '', Buf)
  else
    Result := '';
end;
[Run]
; Run the post-install helper non-interactively with values collected on the custom page
Filename: "{win}\system32\WindowsPowerShell\v1.0\powershell.exe"; \
  Parameters: "-NoProfile -ExecutionPolicy Bypass -File \"\"{app}\\scripts\\postinstall-config.ps1\"\" -Ini \"\"{app}\\dbinstaller.ini\"\" -InstallDir \"\"{app}\"\""; \
  Flags: postinstall waituntilterminated; Description: "Post-install DB configuration"; StatusMsg: "Configuring database settings"

; Run the app (start once)
Filename: "{app}\bin\run-app.bat"; Description: "Start Creo Automation"; Flags: nowait postinstall skipifsilent

; If service registration is desired, call the bundled PowerShell helper which will handle elevation and nssm logic
; Prefer a small wrapper cmd to avoid complex quoting in Inno Parameters
Filename: "{app}\bin\register-service.cmd"; Description: "Register CreoAutomation service"; Flags: runhidden postinstall skipifsilent; StatusMsg: "Configuring Windows service (CreoAutomation)"
Source: "..\dist\*"; DestDir: "{app}"; Flags: recursesubdirs createallsubdirs

[Icons]
Name: "{group}\Creo Automation"; Filename: "{app}\bin\run-app.bat"

[Run]
; Run the app (start once)
Filename: "{app}\bin\run-app.bat"; Description: "Start Creo Automation"; Flags: nowait postinstall skipifsilent
; If service registration is desired, call the bundled PowerShell helper which will handle elevation and nssm logic
; Prefer a small wrapper cmd to avoid complex quoting in Inno Parameters
Filename: "{app}\bin\register-service.cmd"; Description: "Register CreoAutomation service"; Flags: runhidden postinstall skipifsilent; StatusMsg: "Configuring Windows service (CreoAutomation)"

; Run the interactive post-install DB config helper (will prompt admin)
; Run the post-install helper non-interactively with values collected on the custom page
Filename: "{win}\system32\WindowsPowerShell\v1.0\powershell.exe"; \
  Parameters: "-NoProfile -ExecutionPolicy Bypass -File \"\"{app}\\scripts\\postinstall-config.ps1\"\" -InstallDir \"\"{app}\"\" -Host \"\"{code:GetIniString('DB','Host','{app}\\dbinstaller.ini')}\"\" -Port \"\"{code:GetIniString('DB','Port','{app}\\dbinstaller.ini')}\"\" -Name \"\"{code:GetIniString('DB','Name','{app}\\dbinstaller.ini')}\"\" -User \"\"{code:GetIniString('DB','User','{app}\\dbinstaller.ini')}\"\" -Password \"\"{code:GetIniString('DB','Pass','{app}\\dbinstaller.ini')}\"\" {code:GetIniString('DB','Ssl','{app}\\dbinstaller.ini')|\n+    Replace('1','-Ssl')}"; \
  Flags: postinstall nowait; Description: "Post-install DB configuration"; StatusMsg: "Configuring database settings"

[UninstallRun]
; Call the PowerShell helper to stop and remove the service during uninstall
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
  EditHost := TEdit.Create(DBPage);
  EditHost.Parent := DBPage.Surface;
  EditHost.Left := 0; EditHost.Top := 8; EditHost.Width := DBPage.SurfaceWidth;
  EditHost.Text := 'localhost';

  EditPort := TEdit.Create(DBPage);
  EditPort.Parent := DBPage.Surface;
  EditPort.Left := 0; EditPort.Top := EditHost.Top + 32; EditPort.Width := DBPage.SurfaceWidth;
  EditPort.Text := '3306';

  EditName := TEdit.Create(DBPage);
  EditName.Parent := DBPage.Surface;
  EditName.Left := 0; EditName.Top := EditPort.Top + 32; EditName.Width := DBPage.SurfaceWidth;
  EditName.Text := 'saidb';

  EditUser := TEdit.Create(DBPage);
  EditUser.Parent := DBPage.Surface;
  EditUser.Left := 0; EditUser.Top := EditName.Top + 32; EditUser.Width := DBPage.SurfaceWidth;
  EditUser.Text := 'doadmin';

  EditPass := TEdit.Create(DBPage);
  EditPass.Parent := DBPage.Surface;
  EditPass.Left := 0; EditPass.Top := EditUser.Top + 32; EditPass.Width := DBPage.SurfaceWidth;
  EditPass.PasswordChar := '*';

  CheckSsl := TCheckBox.Create(DBPage);
  CheckSsl.Parent := DBPage.Surface;
  CheckSsl.Left := 0; CheckSsl.Top := EditPass.Top + 32; CheckSsl.Caption := 'Use SSL for DB connection';
end;

function NextButtonClick(CurPageID: Integer): Boolean;
begin
  Result := True;
  if CurPageID = DBPage.ID then
  begin
    SetIniString('DB', 'Host', EditHost.Text, ExpandConstant('{app}\dbinstaller.ini'));
    SetIniString('DB', 'Port', EditPort.Text, ExpandConstant('{app}\dbinstaller.ini'));
    SetIniString('DB', 'Name', EditName.Text, ExpandConstant('{app}\dbinstaller.ini'));
    SetIniString('DB', 'User', EditUser.Text, ExpandConstant('{app}\dbinstaller.ini'));
    SetIniString('DB', 'Pass', EditPass.Text, ExpandConstant('{app}\dbinstaller.ini'));
    if CheckSsl.Checked then
      SetIniString('DB', 'Ssl', '1', ExpandConstant('{app}\dbinstaller.ini'))
    else
      SetIniString('DB', 'Ssl', '0', ExpandConstant('{app}\dbinstaller.ini'));
  end;
end;

procedure InitializeWizard();
begin
  CreateDBPage();
end;

// Helper to return an INI value so we can expand it in the Parameters field
function GetIniString(const Section, Key, Filename: string): string;
var
  Buf: string;
begin
  Buf := ExpandConstant(Filename);
  if FileExists(Buf) then
    Result := GetIniStringFromFile(Section, Key, '', Buf)
  else
    Result := '';
end;


