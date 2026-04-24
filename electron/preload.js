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

  // PPPoE API Methods
  getPppoeSecrets: (id) => ipcRenderer.invoke('mikrotik:get-pppoe-secrets', id),
  getPppoeProfiles: (id) => ipcRenderer.invoke('mikrotik:get-pppoe-profiles', id),
  getActivePppoe: (id) => ipcRenderer.invoke('mikrotik:get-active-pppoe', id),
  addPppoeSecret: (id, data) => ipcRenderer.invoke('mikrotik:add-pppoe-secret', id, data),
  updatePppoeSecret: (id, secretId, data) => ipcRenderer.invoke('mikrotik:update-pppoe-secret', id, secretId, data),
  deletePppoeSecret: (id, secretId) => ipcRenderer.invoke('mikrotik:delete-pppoe-secret', id, secretId),

  // Cleanup listeners
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  }
});
