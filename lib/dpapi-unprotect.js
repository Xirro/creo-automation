const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Decrypt a Base64-encoded DPAPI-protected blob using PowerShell and return plaintext.
// Uses LocalMachine scope so services running as different users can read it.
function unprotectFile(encPath) {
  if (!fs.existsSync(encPath)) return null;
  const abs = path.resolve(encPath);
  // Build a PowerShell one-liner to read Base64, unprotect with LocalMachine, output UTF8 text
  const ps = `try { $b = [System.Convert]::FromBase64String([System.IO.File]::ReadAllText('${abs}')); $p = [System.Security.Cryptography.ProtectedData]::Unprotect($b, $null, [System.Security.Cryptography.DataProtectionScope]::LocalMachine); [System.Console]::Out.Write([System.Text.Encoding]::UTF8.GetString($p)) } catch { exit 2 }`;
  try {
    const out = execFileSync('powershell', ['-NoProfile', '-NonInteractive', '-Command', ps], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return out.toString();
  } catch (e) {
    // Return null on failure
    return null;
  }
}

module.exports = { unprotectFile };
