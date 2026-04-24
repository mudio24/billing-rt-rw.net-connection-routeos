/**
 * Electron Main Process
 * Handles window creation, IPC communication, and auto-connect on startup
 */

const { app, BrowserWindow, ipcMain, globalShortcut } = require('electron');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const dbService = require('./services/router-db-service');
const mikrotikService = require('./services/mikrotik-service');

// Listen for connection drops (Heartbeat failure or TCP Socket close)
mikrotikService.on('connection-lost', async (data) => {
  console.log(`[App] Event: connection-lost for router ${data.routerId} - ${data.message}`);
  await dbService.updateConnectionStatus(data.routerId, false, data.message);
  
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('router:connection-update', {
      routerId: data.routerId,
      status: 'offline',
      message: data.message
    });
  }
});

let mainWindow = null;

/**
 * Create the main application window
 */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'Mikrotik Router Manager',
    icon: path.join(__dirname, '..', 'src', 'assets', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      zoomFactor: 1.0
    },
    backgroundColor: '#0a0e1a',
    show: false,
    autoHideMenuBar: true
  });

  // Load the app
  if (process.env.NODE_ENV === 'development' || process.argv.includes('--dev')) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  // Show when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    // Auto-connect after window is shown
    setTimeout(() => autoConnectRouters(), 2000);
  });

  // Enable zoom controls
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.control || input.meta) {
      if (input.key === '=' || input.key === '+') {
        // Zoom in (Ctrl + =  or Ctrl + +)
        const currentZoom = mainWindow.webContents.getZoomFactor();
        mainWindow.webContents.setZoomFactor(Math.min(currentZoom + 0.1, 3.0));
        event.preventDefault();
      } else if (input.key === '-') {
        // Zoom out (Ctrl + -)
        const currentZoom = mainWindow.webContents.getZoomFactor();
        mainWindow.webContents.setZoomFactor(Math.max(currentZoom - 0.1, 0.3));
        event.preventDefault();
      } else if (input.key === '0') {
        // Reset zoom (Ctrl + 0)
        mainWindow.webContents.setZoomFactor(1.0);
        event.preventDefault();
      }
    }
  });

  // Enable zoom with mouse scroll (Ctrl + Scroll)
  mainWindow.webContents.on('zoom-changed', (event, zoomDirection) => {
    const currentZoom = mainWindow.webContents.getZoomFactor();
    if (zoomDirection === 'in') {
      mainWindow.webContents.setZoomFactor(Math.min(currentZoom + 0.1, 3.0));
    } else {
      mainWindow.webContents.setZoomFactor(Math.max(currentZoom - 0.1, 0.3));
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

/**
 * Auto-connect to all active routers on startup
 */
async function autoConnectRouters() {
  console.log('[App] Starting auto-connect to all active routers...');
  const routerConfigs = await dbService.getAllRouterConfigs();

  if (routerConfigs.length === 0) {
    console.log('[App] No active routers found for auto-connect');
    return;
  }

  const results = [];
  for (const config of routerConfigs) {
    const result = await mikrotikService.connect(config);
    dbService.updateConnectionStatus(config.id, result.success, result.success ? null : result.message);
    results.push({
      routerId: config.id,
      name: config.name,
      success: result.success,
      message: result.message
    });
  }

  // Notify frontend about auto-connect results
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('router:auto-connect-result', results);
  }

  console.log('[App] Auto-connect completed:', results.map(r => `${r.name}: ${r.success ? '✅' : '❌'}`).join(', '));
}

// ============================================
// IPC HANDLERS
// ============================================

// Get all routers
ipcMain.handle('router:get-all', async () => {
  return dbService.getAllRouters();
});

// Add new router
ipcMain.handle('router:add', async (event, data) => {
  return dbService.addRouter(data);
});

// Update router
ipcMain.handle('router:update', async (event, id, data) => {
  return dbService.updateRouter(id, data);
});

// Delete router (soft delete)
ipcMain.handle('router:delete', async (event, id) => {
  // Disconnect first if connected
  if (mikrotikService.isConnected(id)) {
    await mikrotikService.disconnect(id);
    dbService.updateConnectionStatus(id, false, null);
  }
  return dbService.deleteRouter(id);
});

// Connect to router
ipcMain.handle('router:connect', async (event, id) => {
  const router = await dbService.getRouterById(id, true);
  if (!router) {
    return { success: false, message: 'Router tidak ditemukan' };
  }

  const config = {
    id: router.id,
    name: router.name,
    ip_address: router.ip_address,
    mac_address: router.mac_address,
    api_port: router.api_port,
    username: router.username,
    password: router.decryptedPassword || ''
  };

  const result = await mikrotikService.connect(config);
  dbService.updateConnectionStatus(id, result.success, result.success ? null : result.message);

  return result;
});

// Disconnect from router
ipcMain.handle('router:disconnect', async (event, id) => {
  const result = await mikrotikService.disconnect(id);
  dbService.updateConnectionStatus(id, false, null);
  return result;
});

// Test connection
ipcMain.handle('router:test-connection', async (event, data) => {
  return mikrotikService.testConnection({
    ip_address: data.ip_address,
    api_port: data.api_port || 8728,
    username: data.username,
    password: data.password
  });
});

// ============================================
// PPPoE HANDLERS
// ============================================

ipcMain.handle('mikrotik:get-pppoe-secrets', async (event, id) => {
  try {
    const data = await mikrotikService.getPppoeSecrets(id);
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('mikrotik:get-pppoe-profiles', async (event, id) => {
  try {
    const data = await mikrotikService.getPppoeProfiles(id);
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('mikrotik:get-active-pppoe', async (event, id) => {
  try {
    const data = await mikrotikService.getActivePppoe(id);
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('mikrotik:add-pppoe-secret', async (event, id, data) => {
  try {
    await mikrotikService.addPppoeSecret(id, data);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('mikrotik:update-pppoe-secret', async (event, id, secretId, data) => {
  try {
    await mikrotikService.updatePppoeSecret(id, secretId, data);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('mikrotik:delete-pppoe-secret', async (event, id, secretId) => {
  try {
    await mikrotikService.deletePppoeSecret(id, secretId);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// ============================================
// APP LIFECYCLE
// ============================================

app.whenReady().then(async () => {
  // Initialize database
  try {
    await dbService.initDatabase();
    
    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  } catch (err) {
    console.error('[App] Failed to start because database initialization failed:', err);
  }
});

app.on('window-all-closed', async () => {
  // Cleanup: disconnect all routers
  await mikrotikService.disconnectAll();
  dbService.closeDatabase();

  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', async () => {
  await mikrotikService.disconnectAll();
  dbService.closeDatabase();
});
