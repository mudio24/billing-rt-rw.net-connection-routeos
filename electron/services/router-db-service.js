/**
 * Router Database Service
 * Handles all CRUD operations for routers and connection status
 * Uses better-sqlite3 for synchronous, reliable database operations
 */

const Database = require('better-sqlite3');
const crypto = require('crypto');
const path = require('path');
require('dotenv').config();

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'mikrotik-manager-secret-key-2026';
const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

// Derive a 32-byte key from the encryption key string
function getKey() {
  return crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
}

let db = null;

/**
 * Initialize the database and create tables if they don't exist
 */
function initDatabase(dbPath) {
  const resolvedPath = dbPath || process.env.DB_PATH || './data/app.db';
  const fullPath = path.resolve(resolvedPath);

  // Ensure directory exists
  const dir = path.dirname(fullPath);
  const fs = require('fs');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  db = new Database(fullPath);

  // Enable WAL mode for better performance
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // Create routers table
  db.exec(`
    CREATE TABLE IF NOT EXISTS routers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      ip_address TEXT NOT NULL UNIQUE,
      mac_address TEXT,
      api_port INTEGER DEFAULT 8728,
      username TEXT NOT NULL,
      password TEXT NOT NULL DEFAULT '',
      description TEXT,
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create router_connections table
  db.exec(`
    CREATE TABLE IF NOT EXISTS router_connections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      router_id INTEGER NOT NULL,
      is_connected BOOLEAN DEFAULT 0,
      last_connected DATETIME,
      last_disconnected DATETIME,
      error_message TEXT,
      FOREIGN KEY (router_id) REFERENCES routers(id) ON DELETE CASCADE
    )
  `);

  console.log('[DB] Database initialized at:', fullPath);
  return db;
}

/**
 * Encrypt password using AES-256-CBC
 */
function encryptPassword(password) {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(password, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

/**
 * Decrypt password
 */
function decryptPassword(encryptedPassword) {
  try {
    const key = getKey();
    const parts = encryptedPassword.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('[DB] Error decrypting password:', err.message);
    return null;
  }
}

/**
 * Add a new router
 */
function addRouter(data) {
  try {
    const encryptedPassword = data.password ? encryptPassword(data.password) : encryptPassword('');

    const stmt = db.prepare(`
      INSERT INTO routers (name, ip_address, mac_address, api_port, username, password, description)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      data.name,
      data.ip_address,
      data.mac_address || null,
      data.api_port || 8728,
      data.username,
      encryptedPassword,
      data.description || null
    );

    // Create connection record
    const connStmt = db.prepare(`
      INSERT INTO router_connections (router_id, is_connected)
      VALUES (?, 0)
    `);
    connStmt.run(result.lastInsertRowid);

    console.log('[DB] Router added:', data.name, '(ID:', result.lastInsertRowid, ')');
    return { success: true, id: result.lastInsertRowid };
  } catch (err) {
    console.error('[DB] Error adding router:', err.message);
    if (err.message.includes('UNIQUE constraint failed')) {
      return { success: false, error: 'IP address sudah terdaftar di database' };
    }
    return { success: false, error: err.message };
  }
}

/**
 * Get all active routers with connection status
 */
function getAllRouters() {
  try {
    const stmt = db.prepare(`
      SELECT r.*, 
             rc.is_connected, 
             rc.last_connected, 
             rc.last_disconnected, 
             rc.error_message
      FROM routers r
      LEFT JOIN router_connections rc ON r.id = rc.router_id
      WHERE r.is_active = 1
      ORDER BY r.created_at DESC
    `);

    const routers = stmt.all();

    // Strip password from results (never send to frontend)
    return routers.map(r => ({
      ...r,
      password: '********',
      is_connected: r.is_connected === 1
    }));
  } catch (err) {
    console.error('[DB] Error fetching routers:', err.message);
    return [];
  }
}

/**
 * Get a single router by ID (with decrypted password for internal use)
 */
function getRouterById(id, includePassword = false) {
  try {
    const stmt = db.prepare(`
      SELECT r.*, 
             rc.is_connected, 
             rc.last_connected, 
             rc.last_disconnected, 
             rc.error_message
      FROM routers r
      LEFT JOIN router_connections rc ON r.id = rc.router_id
      WHERE r.id = ? AND r.is_active = 1
    `);

    const router = stmt.get(id);
    if (!router) return null;

    if (includePassword) {
      router.decryptedPassword = decryptPassword(router.password);
    }
    router.password = '********';
    router.is_connected = router.is_connected === 1;

    return router;
  } catch (err) {
    console.error('[DB] Error fetching router:', err.message);
    return null;
  }
}

/**
 * Update router
 */
function updateRouter(id, data) {
  try {
    let query, params;

    if (data.password && data.password !== '********') {
      // Password changed - encrypt the new one
      const encryptedPassword = encryptPassword(data.password);
      query = `
        UPDATE routers 
        SET name = ?, ip_address = ?, mac_address = ?, api_port = ?, username = ?, password = ?, description = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND is_active = 1
      `;
      params = [data.name, data.ip_address, data.mac_address || null, data.api_port || 8728, data.username, encryptedPassword, data.description || null, id];
    } else {
      // Password not changed
      query = `
        UPDATE routers 
        SET name = ?, ip_address = ?, mac_address = ?, api_port = ?, username = ?, description = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND is_active = 1
      `;
      params = [data.name, data.ip_address, data.mac_address || null, data.api_port || 8728, data.username, data.description || null, id];
    }

    const stmt = db.prepare(query);
    const result = stmt.run(...params);

    if (result.changes === 0) {
      return { success: false, error: 'Router tidak ditemukan' };
    }

    console.log('[DB] Router updated: ID', id);
    return { success: true };
  } catch (err) {
    console.error('[DB] Error updating router:', err.message);
    if (err.message.includes('UNIQUE constraint failed')) {
      return { success: false, error: 'IP address sudah digunakan router lain' };
    }
    return { success: false, error: err.message };
  }
}

/**
 * Soft delete router (set is_active = 0)
 */
function deleteRouter(id) {
  try {
    const stmt = db.prepare(`
      UPDATE routers SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `);
    const result = stmt.run(id);

    if (result.changes === 0) {
      return { success: false, error: 'Router tidak ditemukan' };
    }

    console.log('[DB] Router soft-deleted: ID', id);
    return { success: true };
  } catch (err) {
    console.error('[DB] Error deleting router:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Update connection status for a router
 */
function updateConnectionStatus(routerId, isConnected, errorMessage = null) {
  try {
    const now = new Date().toISOString();
    let query, params;

    if (isConnected) {
      query = `
        UPDATE router_connections 
        SET is_connected = 1, last_connected = ?, error_message = NULL
        WHERE router_id = ?
      `;
      params = [now, routerId];
    } else {
      query = `
        UPDATE router_connections 
        SET is_connected = 0, last_disconnected = ?, error_message = ?
        WHERE router_id = ?
      `;
      params = [now, errorMessage, routerId];
    }

    const stmt = db.prepare(query);
    stmt.run(...params);
    console.log(`[DB] Connection status updated: Router ${routerId} -> ${isConnected ? 'Connected' : 'Disconnected'}`);
  } catch (err) {
    console.error('[DB] Error updating connection status:', err.message);
  }
}

/**
 * Get all active router configs with decrypted passwords (for auto-connect)
 */
function getAllRouterConfigs() {
  try {
    const stmt = db.prepare(`
      SELECT id, name, ip_address, api_port, username, password
      FROM routers WHERE is_active = 1
    `);

    return stmt.all().map(r => ({
      ...r,
      password: decryptPassword(r.password)
    }));
  } catch (err) {
    console.error('[DB] Error fetching router configs:', err.message);
    return [];
  }
}

/**
 * Close database connection
 */
function closeDatabase() {
  if (db) {
    db.close();
    console.log('[DB] Database closed');
  }
}

module.exports = {
  initDatabase,
  addRouter,
  getAllRouters,
  getRouterById,
  updateRouter,
  deleteRouter,
  updateConnectionStatus,
  encryptPassword,
  decryptPassword,
  getAllRouterConfigs,
  closeDatabase
};
