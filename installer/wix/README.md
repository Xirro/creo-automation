WiX MSI build instructions for Creo Automation

Prerequisites
- Windows 10/11 or Server
- WiX Toolset (3.11 or 4.x). Ensure heat.exe, candle.exe, and light.exe are available on PATH.
- PowerShell (desktop) to run the build script

Quick build
1. Prepare your application payload (e.g., a zipped output or distribution) and place it in a folder, e.g. `dist\`.
2. From the repository root, run PowerShell:

   powershell -ExecutionPolicy Bypass -File installer\build-msi.ps1 -Version 1.0.0 -SourceDir "dist" -OutDir "installer\output"

3. The script will produce `installer\output\CreoAutomation-1.0.0.msi`.

Major upgrade behavior
- The Product.wxs sets a stable UpgradeCode GUID. Each build generates a new Product Id. When you install a new MSI built this way, the MajorUpgrade element in Product.wxs will detect and remove previous versions with the same UpgradeCode automatically.

Customization
- Edit `installer\wix\Product.wxs` to add shortcuts, registry entries, services, or custom actions.
- If you want per-user install, change Package/@InstallScope to `perUser` and adjust directories.

Notes
- Test the MSI on a clean VM and on a machine with a prior install to verify upgrade/uninstall behavior and to ensure no files are left behind.
- For advanced scenarios (auto-update, delta patches, signed MSIs), consider using a CI pipeline and code-signing certificates.

Code signing and CI (quick guide)
- Signing options:
   - Use a PFX certificate file (preferred for CI): set repository secret `SIGNING_PFX` to the base64-encoded PFX content and `SIGNING_PASSWORD` to its password. The CI workflow will decode the PFX and set `SIGNING_PFX` on disk before invoking `signtool`.
   - Use a certificate installed in the Windows certificate store: set `SIGNING_CERT_SUBJECT` to the subject name and the CI runner must have access to the certificate.

- GitHub Actions (recommended): include the workflow `.github/workflows/build-msi.yml` (provided) which:
   - Runs on tags (for releases) and on pushes to `main`.
   - Installs WiX Toolset on the runner.
   - Runs `installer\build-msi.ps1 -Version ${{ github.ref_name }} -SourceDir "dist" -OutDir "installer/output"`.
   - If `SIGNING_PFX` and `SIGNING_PASSWORD` secrets are present, the workflow signs the MSI and uploads it as an artifact.

Security notes:
- Keep your PFX secrets in the repository's secrets store and restrict access.
- Prefer ephemeral signing keys or an HSM-backed signing service for production releases.
