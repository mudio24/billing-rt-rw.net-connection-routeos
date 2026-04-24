/**
 * Mikrotik Service
 * Handles connections to Mikrotik routers via custom RouterOS API client
 * Manages multiple concurrent connections using a Map
 * Features active heartbeat monitoring
 */

const MikrotikAPI = require('./mikrotik-api');
const { exec } = require('child_process');
const { EventEmitter } = require('events');

class MikrotikServiceManager extends EventEmitter {
  constructor() {
    super();
    // Store active connections: routerId -> { client, config }
    this.connections = new Map();
    this.heartbeatInterval = null;
    
    // Start heartbeat
    this._startHeartbeat();
  }

  /**
   * Start a periodic heartbeat check
   */
  _startHeartbeat() {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    
    // Check every 15 seconds
    this.heartbeatInterval = setInterval(async () => {
      if (this.connections.size === 0) return;
      
      const promises = [];
      for (const [routerId, { client, config }] of this.connections) {
        promises.push(this._checkConnection(routerId, client, config));
      }
      
      await Promise.allSettled(promises);
    }, 15000);
  }

  /**
   * Internal function to check a single connection
   */
  async _checkConnection(routerId, client, config) {
    try {
      // Very lightweight command
      await client.write('/system/identity/print');
    } catch (err) {
      console.error(`[MikroTik] 💔 Heartbeat failed for ${config.name} (${config.ip_address}):`, err.message);
      // Connection is dead
      this.connections.delete(routerId);
      try { await client.close(); } catch {}
      
      // Emit event so main.js can update UI and DB
      this.emit('connection-lost', {
        routerId,
        config,
        message: 'Koneksi terputus: jaringan tidak stabil atau mesin mati'
      });
    }
  }

  /**
   * Resolve MAC address to IP address using ARP table
   */
  async resolveMacToIp(macAddress) {
    if (!macAddress) return null;

    const normalizedMac = macAddress.toLowerCase().replace(/:/g, '-');

    return new Promise((resolve) => {
      exec('ping -n 1 -w 500 255.255.255.255', { timeout: 3000 }, () => {
        exec('arp -a', { timeout: 5000 }, (error, stdout) => {
          if (error) {
            console.log('[MikroTik] ARP lookup failed:', error.message);
            resolve(null);
            return;
          }

          const lines = stdout.split('\n');
          for (const line of lines) {
            const lower = line.toLowerCase().trim();
            if (lower.includes(normalizedMac)) {
              const match = lower.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/);
              if (match) {
                console.log(`[MikroTik] MAC ${macAddress} resolved to IP ${match[1]}`);
                resolve(match[1]);
                return;
              }
            }
          }

          console.log(`[MikroTik] MAC ${macAddress} not found in ARP table`);
          resolve(null);
        });
      });
    });
  }

  /**
   * Parse error message into user-friendly Indonesian text
   */
  parseError(err) {
    const msg = err.message || String(err);
    if (msg.includes('ECONNREFUSED')) {
      return 'Koneksi ditolak. Pastikan API service aktif di router dan IP/Port benar';
    } else if (msg.includes('EHOSTUNREACH') || msg.includes('ENETUNREACH')) {
      return 'Router tidak dapat dijangkau. Periksa koneksi jaringan';
    } else if (msg.includes('ETIMEDOUT') || msg.includes('timeout') || msg.includes('Timeout')) {
      return 'Koneksi timeout. Router tidak merespons';
    } else if (msg.includes('cannot log in') || msg.includes('invalid user') || msg.includes('Login failure') || msg.includes('wrong password')) {
      return 'Username atau password salah';
    } else if (msg.includes('ENOTFOUND')) {
      return 'Alamat IP/hostname tidak ditemukan';
    }
    return `Error: ${msg}`;
  }

  /**
   * Connect to a Mikrotik router
   */
  async connect(config) {
    const routerId = config.id;

    // Check if already connected
    if (this.connections.has(routerId)) {
      const existing = this.connections.get(routerId);
      try {
        await existing.client.write('/system/identity/print');
        return { success: true, message: `Sudah terkoneksi ke ${config.name}`, routerId };
      } catch {
        try { await existing.client.close(); } catch {}
        this.connections.delete(routerId);
      }
    }

    // Try connecting with IP first
    let connectIp = config.ip_address;
    let result = await this.tryConnect(connectIp, config);

    // If IP fails and MAC address is available, try resolving MAC to IP
    if (!result.success && config.mac_address) {
      console.log(`[MikroTik] IP connection failed. Trying MAC resolution for ${config.mac_address}...`);
      const resolvedIp = await this.resolveMacToIp(config.mac_address);
      if (resolvedIp && resolvedIp !== connectIp) {
        console.log(`[MikroTik] Retrying with resolved IP: ${resolvedIp}`);
        connectIp = resolvedIp;
        result = await this.tryConnect(resolvedIp, config);
      }
    }

    if (result.success) {
      this.connections.set(routerId, {
        client: result.client,
        config: { ...config, resolvedIp: connectIp, routerIdentity: result.identity }
      });

      console.log(`[MikroTik] ✅ Connected to ${config.name} (Identity: ${result.identity}) via ${connectIp}`);
      
      this.emit('connection-established', {
        routerId,
        config
      });

      return {
        success: true,
        message: `Berhasil terkoneksi ke ${config.name} (${result.identity})`,
        routerId,
        identity: result.identity
      };
    }

    return { success: false, message: result.message, routerId };
  }

  /**
   * Internal: try connecting to a specific IP
   */
  async tryConnect(ip, config) {
    try {
      console.log(`[MikroTik] Connecting to ${config.name} (${ip}:${config.api_port})...`);

      const client = new MikrotikAPI({
        host: ip,
        port: config.api_port || 8728,
        user: config.username,
        password: config.password || '',
        timeout: 8
      });

      await client.connect();

      // Verify connection by getting identity
      const identityResult = await client.write('/system/identity/print');
      const routerName = identityResult.length > 0 ? identityResult[0].name : 'Unknown';

      // We explicitly attach a close listener to catch unhandled socket close
      if (client.socket) {
        client.socket.on('close', () => {
          if (this.connections.has(config.id)) {
            console.log(`[MikroTik] Socket unilaterally closed by peer for ${config.name}`);
            this.connections.delete(config.id);
            this.emit('connection-lost', {
              routerId: config.id,
              config,
              message: 'Soket ditutup sepihak oleh router'
            });
          }
        });
        
        client.socket.on('error', (err) => {
          if (this.connections.has(config.id)) {
            console.error(`[MikroTik] Socket error for ${config.name}:`, err.message);
            this.connections.delete(config.id);
            this.emit('connection-lost', {
              routerId: config.id,
              config,
              message: 'Fatal Socket Error: ' + err.message
            });
          }
        });
      }

      return { success: true, client, identity: routerName };
    } catch (err) {
      console.error(`[MikroTik] ❌ Failed to connect via ${ip}:`, err.message);
      return { success: false, message: this.parseError(err) };
    }
  }

  /**
   * Disconnect from a router
   */
  async disconnect(routerId) {
    if (!this.connections.has(routerId)) {
      return { success: true, message: 'Router sudah tidak terkoneksi' };
    }

    try {
      const { client, config } = this.connections.get(routerId);
      // Remove listeners so we don't trigger connection-lost on intentional disconnect
      if (client.socket) {
        client.socket.removeAllListeners('close');
        client.socket.removeAllListeners('error');
      }
      await client.close();
      this.connections.delete(routerId);
      console.log(`[MikroTik] Disconnected from ${config.name}`);
      return { success: true, message: `Berhasil disconnect dari ${config.name}` };
    } catch (err) {
      this.connections.delete(routerId);
      console.error(`[MikroTik] Error disconnecting:`, err.message);
      return { success: true, message: 'Disconnected (with cleanup)' };
    }
  }

  /**
   * Test connection without keeping it permanent
   */
  async testConnection(config) {
    let client = null;
    try {
      console.log(`[MikroTik] Testing connection to ${config.ip_address}:${config.api_port}...`);

      client = new MikrotikAPI({
        host: config.ip_address,
        port: config.api_port || 8728,
        user: config.username,
        password: config.password || '',
        timeout: 8
      });

      await client.connect();
      const identityResult = await client.write('/system/identity/print');
      const routerName = identityResult.length > 0 ? identityResult[0].name : 'Unknown';
      await client.close();

      console.log(`[MikroTik] ✅ Test successful: ${routerName}`);
      return {
        success: true,
        message: `Koneksi berhasil! Router: ${routerName}`,
        identity: routerName
      };
    } catch (err) {
      console.error(`[MikroTik] ❌ Test failed:`, err.message);
      if (client) { try { await client.close(); } catch {} }
      return { success: false, message: this.parseError(err) };
    }
  }

  /**
   * Check if a router is connected
   */
  isConnected(routerId) {
    return this.connections.has(routerId);
  }

  /**
   * Get client for a connected router (for Phase 2 queries)
   */
  getClient(routerId) {
    if (!this.connections.has(routerId)) return null;
    return this.connections.get(routerId).client;
  }

  /**
   * Get all connection statuses
   */
  getAllConnectionStatuses() {
    const statuses = {};
    for (const [routerId, { config }] of this.connections) {
      statuses[routerId] = {
        connected: true,
        name: config.name,
        identity: config.routerIdentity
      };
    }
    return statuses;
  }

  /**
   * Disconnect all routers (cleanup on app exit)
   */
  async disconnectAll() {
    console.log(`[MikroTik] Disconnecting all routers...`);
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    
    const promises = [];
    for (const [routerId] of this.connections) {
      promises.push(this.disconnect(routerId));
    }
    await Promise.allSettled(promises);
    console.log(`[MikroTik] All routers disconnected`);
  }

  // ==================
  // PPPoE Methods
  // ==================
  async getPppoeSecrets(id) { 
    const client = this.getClient(id); 
    if (!client) throw new Error('Not connected'); 
    return client.write('/ppp/secret/print'); 
  }
  
  async getPppoeProfiles(id) { 
    const client = this.getClient(id); 
    if (!client) throw new Error('Not connected'); 
    return client.write('/ppp/profile/print'); 
  }
  
  async getActivePppoe(id) { 
    const client = this.getClient(id); 
    if (!client) throw new Error('Not connected'); 
    return client.write('/ppp/active/print'); 
  }
  
  async addPppoeSecret(id, data) { 
    const client = this.getClient(id); 
    if (!client) throw new Error('Not connected'); 
    return client.write('/ppp/secret/add', { 
      name: data.name, 
      password: data.password, 
      service: 'pppoe', 
      profile: data.profile, 
      comment: data.comment || '' 
    }); 
  }
  
  async updatePppoeSecret(id, secretId, data) { 
    const client = this.getClient(id); 
    if (!client) throw new Error('Not connected'); 
    return client.write('/ppp/secret/set', { 
      '.id': secretId, 
      name: data.name, 
      password: data.password, 
      profile: data.profile, 
      comment: data.comment || '' 
    }); 
  }
  
  async deletePppoeSecret(id, secretId) { 
    const client = this.getClient(id); 
    if (!client) throw new Error('Not connected'); 
    return client.write('/ppp/secret/remove', { '.id': secretId }); 
  }

  // Profile CRUD
  async addPppoeProfile(id, data) {
    const client = this.getClient(id);
    if (!client) throw new Error('Not connected');
    const params = { name: data.name };
    if (data.rate_limit) params['rate-limit'] = data.rate_limit;
    if (data.local_address) params['local-address'] = data.local_address;
    if (data.remote_address) params['remote-address'] = data.remote_address;
    return client.write('/ppp/profile/add', params);
  }

  async updatePppoeProfile(id, profileId, data) {
    const client = this.getClient(id);
    if (!client) throw new Error('Not connected');
    const params = { '.id': profileId, name: data.name };
    if (data.rate_limit !== undefined) params['rate-limit'] = data.rate_limit;
    if (data.local_address !== undefined) params['local-address'] = data.local_address;
    if (data.remote_address !== undefined) params['remote-address'] = data.remote_address;
    return client.write('/ppp/profile/set', params);
  }

  async deletePppoeProfile(id, profileId) {
    const client = this.getClient(id);
    if (!client) throw new Error('Not connected');
    return client.write('/ppp/profile/remove', { '.id': profileId });
  }
}

// Export a singleton instance
module.exports = new MikrotikServiceManager();