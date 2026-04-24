/**
 * Mikrotik Service
 * Handles connections to Mikrotik routers via custom RouterOS API client
 * Manages multiple concurrent connections using a Map
 */

const MikrotikAPI = require('./mikrotik-api');
const { exec } = require('child_process');

// Store active connections: routerId -> { client, config }
const connections = new Map();

/**
 * Resolve MAC address to IP address using ARP table
 */
async function resolveMacToIp(macAddress) {
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
function parseError(err) {
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
async function connect(config) {
  const routerId = config.id;

  // Check if already connected
  if (connections.has(routerId)) {
    const existing = connections.get(routerId);
    try {
      await existing.client.write('/system/identity/print');
      return { success: true, message: `Sudah terkoneksi ke ${config.name}`, routerId };
    } catch {
      try { await existing.client.close(); } catch {}
      connections.delete(routerId);
    }
  }

  // Try connecting with IP first
  let connectIp = config.ip_address;
  let result = await tryConnect(connectIp, config);

  // If IP fails and MAC address is available, try resolving MAC to IP
  if (!result.success && config.mac_address) {
    console.log(`[MikroTik] IP connection failed. Trying MAC resolution for ${config.mac_address}...`);
    const resolvedIp = await resolveMacToIp(config.mac_address);
    if (resolvedIp && resolvedIp !== connectIp) {
      console.log(`[MikroTik] Retrying with resolved IP: ${resolvedIp}`);
      connectIp = resolvedIp;
      result = await tryConnect(resolvedIp, config);
    }
  }

  if (result.success) {
    connections.set(routerId, {
      client: result.client,
      config: { ...config, resolvedIp: connectIp, routerIdentity: result.identity }
    });

    console.log(`[MikroTik] ✅ Connected to ${config.name} (Identity: ${result.identity}) via ${connectIp}`);
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
async function tryConnect(ip, config) {
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

    return { success: true, client, identity: routerName };
  } catch (err) {
    console.error(`[MikroTik] ❌ Failed to connect via ${ip}:`, err.message);
    return { success: false, message: parseError(err) };
  }
}

/**
 * Disconnect from a router
 */
async function disconnect(routerId) {
  if (!connections.has(routerId)) {
    return { success: true, message: 'Router sudah tidak terkoneksi' };
  }

  try {
    const { client, config } = connections.get(routerId);
    await client.close();
    connections.delete(routerId);
    console.log(`[MikroTik] Disconnected from ${config.name}`);
    return { success: true, message: `Berhasil disconnect dari ${config.name}` };
  } catch (err) {
    connections.delete(routerId);
    console.error(`[MikroTik] Error disconnecting:`, err.message);
    return { success: true, message: 'Disconnected (with cleanup)' };
  }
}

/**
 * Test connection without keeping it permanent
 */
async function testConnection(config) {
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
    return { success: false, message: parseError(err) };
  }
}

/**
 * Check if a router is connected
 */
function isConnected(routerId) {
  return connections.has(routerId);
}

/**
 * Get client for a connected router (for Phase 2 queries)
 */
function getClient(routerId) {
  if (!connections.has(routerId)) return null;
  return connections.get(routerId).client;
}

/**
 * Get all connection statuses
 */
function getAllConnectionStatuses() {
  const statuses = {};
  for (const [routerId, { config }] of connections) {
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
async function disconnectAll() {
  console.log(`[MikroTik] Disconnecting all routers...`);
  const promises = [];
  for (const [routerId] of connections) {
    promises.push(disconnect(routerId));
  }
  await Promise.allSettled(promises);
  console.log(`[MikroTik] All routers disconnected`);
}

module.exports = {
  connect,
  disconnect,
  testConnection,
  isConnected,
  getClient,
  getAllConnectionStatuses,
  disconnectAll
};
