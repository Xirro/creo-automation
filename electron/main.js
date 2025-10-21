const { app, BrowserWindow, Menu, MenuItem, shell } = require('electron');
const path = require('path');
const child_process = require('child_process');

let serverProcess = null;
let mainWindow = null;
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

function startServer() {
  // Start the existing server.js using the same Node that runs Electron
  // We spawn a child process so we can stop it when the app quits
  const serverPath = path.join(__dirname, '..', 'server.js');
  serverProcess = child_process.spawn(process.execPath, [serverPath], {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit'
  });

  serverProcess.on('error', (err) => {
    console.error('Failed to start server process:', err);
  });
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
  // give the server a moment to start
  setTimeout(() => {
    createWindow();
  }, 700);
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
