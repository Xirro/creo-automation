const { app, BrowserWindow, Menu, MenuItem, shell, Tray, Notification } = require('electron');
const path = require('path');
const child_process = require('child_process');

let serverProcess = null;
let mainWindow = null;
let tray = null;
// Load launcher secret from env or packaged metadata (package.json -> launcherSecret or build.launcherSecret)
let LAUNCHER_SECRET = process.env.LAUNCHER_SECRET || null;
if (!LAUNCHER_SECRET) {
  try {
    const pkg = require(path.join(__dirname, '..', 'package.json'));
    LAUNCHER_SECRET = pkg.launcherSecret || (pkg.build && pkg.build.launcherSecret) || null;
  } catch (e) { LAUNCHER_SECRET = null; }
}

// Single-instance lock: prevent multiple instances starting the server
const gotSingleInstanceLock = app.requestSingleInstanceLock();
if (!gotSingleInstanceLock) {
  console.log('Another instance is already running - exiting this instance');
  app.quit();
}

// If the exe is invoked with --shutdown we should stop any running server and exit (used by uninstallers)
if (process.argv && process.argv.includes('--shutdown')) {
  // Try to notify running instance via /__shutdown
  (async () => {
    try {
      const http = require('http');
      const options = { hostname: '127.0.0.1', port: process.env.LISTEN_PORT || 3000, path: '/__shutdown', method: 'POST', timeout: 3000 };
      const req = http.request(options, (res) => { res.on('data',()=>{}); res.on('end', ()=> process.exit(0)); });
      req.on('error', ()=> process.exit(0));
      req.end();
    } catch (e) { process.exit(0); }
  })();
}

function startServer() {
  // Start the existing server.js using the same Node that runs Electron
  // We spawn a child process so we can stop it when the app quits
  // Resolve serverPath differently when packaged: electron-builder places unpacked files
  // in resources/app.asar.unpacked/<path>. Use that when available.
  let serverPath = path.join(__dirname, '..', 'server.js');
  if (app.isPackaged) {
    // resourcesPath points to resources directory next to the exe
    // asarUnpack will place server.js into resources/app.asar.unpacked/server.js
    const unpacked = path.join(process.resourcesPath, 'app.asar.unpacked', 'server.js');
    if (require('fs').existsSync(unpacked)) {
      serverPath = unpacked;
    } else {
      // Fallback: try resources/server.js
      const alt = path.join(process.resourcesPath, 'server.js');
      if (require('fs').existsSync(alt)) serverPath = alt;
    }
  }

  // create a small log file so packaged runs can be diagnosed
  const logPath = path.join(path.dirname(app.getPath('exe')), 'debug.log');
  function appendLog(...args) {
    try { require('fs').appendFileSync(logPath, new Date().toISOString() + ' ' + args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ') + '\n'); } catch (e) {}
  }

  appendLog('Starting server process', { serverPath, exec: process.execPath, packaged: app.isPackaged });

  // Show a small tray notification (balloon on Windows) or a native notification as fallback
  function showTrayNotification(title, body) {
    try {
      if (tray && typeof tray.displayBalloon === 'function') {
        // Windows: displayBalloon expects { title, content }
        tray.displayBalloon({ title: title, content: body });
      } else if (Notification) {
        // Cross-platform fallback: native notification
        try { new Notification({ title: title, body: body }).show(); } catch (e) { appendLog(`${title}: ${body}`); }
      } else {
        appendLog(`${title}: ${body}`);
      }
    } catch (e) { appendLog('showTrayNotification failed', e); }
  }

  if (app.isPackaged) {
    // When packaged, Node binary may not be available separately. Start the server in-process.
    try {
      appendLog('Requiring server in-process', serverPath);
      require(serverPath);
      appendLog('Server required successfully (in-process)');
      // notify user
      showTrayNotification('Creo Automation', 'Server started');
    } catch (err) {
      appendLog('Failed to require server in-process:', (err && err.stack) || err);
      console.error('Failed to require server in-process:', err);
    }
  } else {
    serverProcess = child_process.spawn(process.execPath, [serverPath], {
      cwd: path.join(__dirname, '..'),
      stdio: ['ignore','pipe','pipe']
    });

    serverProcess.stdout && serverProcess.stdout.on('data', d => appendLog('server.stdout', d.toString()));
    serverProcess.stderr && serverProcess.stderr.on('data', d => appendLog('server.stderr', d.toString()));
    serverProcess.on('error', (err) => {
      appendLog('Failed to start server process:', (err && err.stack) || err);
      console.error('Failed to start server process:', err);
    });
    // notify on spawn
    serverProcess.on('spawn', () => {
      try { showTrayNotification('Creo Automation', 'Server started'); } catch (e) {}
    });
  }
}

function stopServer() {
  if (serverProcess) {
    // Poll /__status until activeRequests reaches 0 or maxWait reached, then POST /__shutdown
    const http = require('http');
    const maxWaitMs = 15000; // give up after 15s
    const pollInterval = 500; // ms
    let waited = 0;

    const pollStatus = () => {
      const statusOptions = {
        hostname: '127.0.0.1',
        port: 3000,
        path: '/__status',
        method: 'GET',
        timeout: 2000
      };
      const req = http.request(statusOptions, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          // If the server redirected (login page / HTML), or returned non-JSON, avoid throwing
          const contentType = res.headers['content-type'] || '';
          if (res.statusCode !== 200) {
            console.warn(`/__status returned status ${res.statusCode}; proceeding to shutdown`);
            return doShutdown();
          }
          if (!contentType.includes('application/json')) {
            console.warn(`/__status returned content-type ${contentType}; proceeding to shutdown`);
            return doShutdown();
          }
          try {
            const data = JSON.parse(body);
            const active = data && data.activeRequests ? parseInt(data.activeRequests, 10) : 0;
            if (active <= 0) {
              // proceed to shutdown
              doShutdown();
            } else {
              waited += pollInterval;
              if (waited >= maxWaitMs) {
                console.log('Waited for active requests but timeout reached, proceeding to shutdown');
                doShutdown();
              } else {
                setTimeout(pollStatus, pollInterval);
              }
            }
          } catch (e) {
            console.error('Error parsing /__status response:', e);
            // proceed to shutdown as fallback
            doShutdown();
          }
        });
      });
      req.on('error', (err) => {
        console.error('Error requesting /__status:', err);
        // proceed to shutdown as fallback
        doShutdown();
      });
      req.on('timeout', () => req.abort());
      req.end();
    };

    const doShutdown = () => {
      try {
        const shutdownOptions = {
          hostname: '127.0.0.1',
          port: 3000,
          path: '/__shutdown',
          method: 'POST',
          timeout: 3000,
        };
        const req = http.request(shutdownOptions, (res) => {
          res.on('data', () => {});
          res.on('end', () => {
            // give server a moment to exit
            setTimeout(() => {
              try {
                if (serverProcess) serverProcess.kill();
              } catch (err) {
                console.error('Error killing server process after shutdown:', err);
              }
              serverProcess = null;
            }, 1000);
          });
        });
        req.on('error', (err) => {
          console.error('Error requesting /__shutdown:', err);
          try {
            serverProcess.kill();
          } catch (e) {
            console.error('Error killing server process after shutdown error:', e);
          }
          serverProcess = null;
          try { showTrayNotification('Creo Automation', 'Server stopped'); } catch (e) {}
        });
        req.on('timeout', () => req.abort());
        req.end();
      } catch (err) {
        console.error('Error during graceful shutdown request:', err);
        try {
          serverProcess.kill();
        } catch (e) {
          console.error('Error killing server process in catch:', e);
        }
        serverProcess = null;
        try { showTrayNotification('Creo Automation', 'Server stopped'); } catch (e) {}
      }
    };

    // start polling
    pollStatus();
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    }
  });

  const baseUrl = `http://${process.env.LISTEN_HOST || '127.0.0.1'}:${process.env.LISTEN_PORT || 3000}`;
  mainWindow.loadURL(baseUrl);
  // Ensure the window shows up for users
  mainWindow.once('ready-to-show', () => {
    try { mainWindow.show(); } catch (e) {}
  });

  // Create a system tray so users can quit the background process without Task Manager
  // icon now lives in the electron/ folder alongside this file
  const iconPath = path.join(__dirname, 'creo-automation.ico');
  try {
    tray = new Tray(iconPath);
    const trayMenu = Menu.buildFromTemplate([
      { label: 'Show', click: () => { if (mainWindow) { mainWindow.show(); mainWindow.focus(); } } },
      { label: 'Quit', click: () => { try { showTrayNotification('Creo Automation', 'Stopping server...'); stopServer(); } catch (e) { console.error(e); } try { app.quit(); } catch (e) { console.error(e); } } }
    ]);
    tray.setToolTip('Creo Automation');
    tray.setContextMenu(trayMenu);
  } catch (e) {
    appendLog('Tray not available:', e);
  }

  // Application menu: add a View menu item to open the current page in external browser
  const template = [
    {
      label: 'File',
      submenu: [
        { role: 'quit' }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Open in External Browser',
          click: () => {
            openInExternalBrowserPreserveLogin();
          }
        },
        { type: 'separator' },
        { role: 'toggledevtools' },
        { role: 'reload' }
      ]
    }
  ];
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  // Context menu (right-click) to open current URL externally
  const ctxMenu = new Menu();
  ctxMenu.append(new MenuItem({
    label: 'Open in External Browser',
    click: () => {
      openInExternalBrowserPreserveLogin();
    }
  }));

  // Opens the current page in the external browser while attempting to preserve the logged-in session
  async function openInExternalBrowserPreserveLogin(dest) {
    try {
      const baseUrl = `http://${process.env.LISTEN_HOST || '127.0.0.1'}:${process.env.LISTEN_PORT || 3000}`;
      // Get cookies for the app origin (connect.sid)
      const ses = mainWindow.webContents.session;
      const cookies = await ses.cookies.get({ url: baseUrl });
      const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ');

      // POST to /__create_token with the Cookie header so the server can map token to this session
      const http = require('http');
      const postData = '';
      const options = {
        hostname: '127.0.0.1',
        port: process.env.LISTEN_PORT || 3000,
        path: '/__create_token',
        method: 'POST',
        headers: Object.assign({
          'Cookie': cookieHeader,
          'Content-Length': Buffer.byteLength(postData)
        }, (process.env.LAUNCHER_SECRET ? { 'X-Launcher-Secret': process.env.LAUNCHER_SECRET } : {})),
        timeout: 3000
      };

      const token = await new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
          let body = '';
          res.on('data', chunk => body += chunk);
          res.on('end', () => {
            try {
              if (res.statusCode !== 200) return reject(new Error('Failed to create token: ' + res.statusCode));
              const data = JSON.parse(body);
              resolve(data.token);
            } catch (e) { reject(e); }
          });
        });
        req.on('error', reject);
        req.on('timeout', () => { req.abort(); reject(new Error('timeout')); });
        req.write(postData);
        req.end();
      });

      if (!token) throw new Error('No token returned');

      const destPath = dest || mainWindow.webContents.getURL() || '/home';
      const loginUrl = `${baseUrl}/__login_with_token?token=${encodeURIComponent(token)}&dest=${encodeURIComponent(destPath)}`;
      shell.openExternal(loginUrl);
    } catch (e) {
      console.error('Failed to open in external browser while preserving login, falling back to regular open:', e);
      try {
        const url = mainWindow.webContents.getURL();
        if (url) shell.openExternal(url);
      } catch (e2) { console.error('Fallback open failed:', e2); }
    }
  }

  mainWindow.webContents.on('context-menu', (e, params) => {
    ctxMenu.popup({ window: mainWindow });
  });

  mainWindow.on('closed', function () {
    mainWindow = null;
    // Stop the spawned server when the window is closed
    try {
      stopServer();
    } catch (err) {
      console.error('Error stopping server on window close:', err);
    }
    // Quit the app once the window is closed
    app.quit();
  });
}

app.on('ready', () => {
  startServer();
  // Wait for the embedded server to become reachable before creating the BrowserWindow.
  // This is more reliable for packaged builds where server startup may be slower or run in-process.
  (function waitForServerThenCreate() {
    const http = require('http');
    const host = process.env.LISTEN_HOST || '127.0.0.1';
    const port = parseInt(process.env.LISTEN_PORT || '3000', 10);
    const maxWaitMs = 15000; // total max wait
    const intervalMs = 500;
    let waited = 0;

    const check = () => {
      const options = { hostname: host, port: port, path: '/__status', method: 'GET', timeout: 2000 };
      const req = http.request(options, (res) => {
        // If we get any response, assume server is up and create the window
        try { res.resume(); } catch (e) {}
        createWindow();
      });
      req.on('error', (err) => {
        waited += intervalMs;
        if (waited >= maxWaitMs) {
          // Give up and create the window anyway (server might be unavailable but we don't want to block startup)
          createWindow();
        } else {
          setTimeout(check, intervalMs);
        }
      });
      req.on('timeout', () => { req.abort(); });
      try { req.end(); } catch (e) { /* ignore */ }
    };

    // start first check after a short delay to allow in-process server creation
    setTimeout(check, 300);
  })();
});

// Handle attempts to start a second instance: focus the existing window
app.on('second-instance', (event, argv, workingDirectory) => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.on('window-all-closed', () => {
  // On macOS it is common for applications to stay open until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    stopServer();
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
