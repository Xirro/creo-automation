Creo Automation Installer
=========================

This folder contains an Inno Setup script template (`setup.iss`) and instructions to create a Windows installer that bundles Node, the app, and prebuilt node_modules.

Prerequisites (builder machine)
- Windows build agent or dev machine
- Node.js (the same Node runtime you plan to ship)
- Visual C++ Build Tools (if native modules exist) to build node_modules
- Inno Setup (to compile the .iss into an installer)

Steps to produce installer locally
1. Build a distributable folder:
   - Open an elevated PowerShell in the repo root and run:
     ```powershell
     .\scripts\build-dist.ps1 -ProjectRoot (Get-Location).Path
     ```
   - This creates `dist/` with `node/`, `node_modules/`, your app files and `bin/run-app.bat`.

2. Compile installer with Inno Setup
   - Open `installer/setup.iss` in Inno Setup and set the `DistPath` constant (or modify the script to use a fixed path).
   - Build the installer (File -> Compile) to produce an EXE in `dist_installer/`.

3. Test the installer on a clean Windows VM to ensure the app starts and runs as expected.

Notes
- Ensure the Node runtime in `dist/node` matches the Node ABI used to compile native modules.
- You may want to add a Windows Service wrapper (NSSM or node-windows) to run the server as a service.
