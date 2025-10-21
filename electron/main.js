const { app, BrowserWindow } = require('electron');
const path = require('path');
const child_process = require('child_process');

let serverProcess = null;
let mainWindow = null;

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

  mainWindow.loadURL('http://localhost:3000');

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
