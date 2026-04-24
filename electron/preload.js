/**
 * Electron Preload Script
 * Exposes IPC channels to the Vue frontend via contextBridge
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Mikrotik CRUD
  getMikrotiks: () => ipcRenderer.invoke('router:get-all'),
  addMikrotik: (data) => ipcRenderer.invoke('router:add', data),
  updateMikrotik: (id, data) => ipcRenderer.invoke('router:update', id, data),
  deleteMikrotik: (id) => ipcRenderer.invoke('router:delete', id),

  // Mikrotik Connectivity
  connectMikrotik: (id) => ipcRenderer.invoke('router:connect', id),
  disconnectMikrotik: (id) => ipcRenderer.invoke('router:disconnect', id),
  testConnection: (data) => ipcRenderer.invoke('router:test-connection', data),

  // Events from main process
  onConnectionUpdate: (callback) => {
    ipcRenderer.on('router:connection-update', (event, data) => callback(data));
  },
  onAutoConnectResult: (callback) => {
    ipcRenderer.on('router:auto-connect-result', (event, data) => callback(data));
  },

  // Cleanup listeners
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  }
});
