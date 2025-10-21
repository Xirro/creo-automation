This folder contains a minimal Electron main process that starts the existing Express server and opens a BrowserWindow to http://localhost:3000.

Usage (development):

1. npm install
2. npm run electron:dev

Notes:
- The Electron process spawns `server.js` from the project root. If you change your server entrypoint, update `electron/main.js` accordingly.
- For production packaging, use electron-builder (not included in this prototype).
