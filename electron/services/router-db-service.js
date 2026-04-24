/**
 * Router Database Service (MySQL)
 * Handles all CRUD operations for routers and connection status
 * Uses mysql2 for asynchronous database operations
 */

const mysql = require('mysql2/promise');
const crypto = require('crypto');
require('dotenv').config();

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'mikrotik-manager-secret-key-2026';
const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

// Derive a 32-byte key from the encryption key string
function getKey() {
  return crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
}

let pool = null;

/**
 * Initialize the database connection pool
 */
async function initDatabase() {
  try {
    // First connect without database to create it if not exists
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || ''
    });

    const dbName = process.env.DB_NAME || 'mikrotik_manager';
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci`);
    await connection.end();

    // Create the connection pool
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || '',
      database: dbName,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    // Create tables if they don't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS routers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        ip_address VARCHAR(100) NOT NULL UNIQUE,
        mac_address VARCHAR(100),
        api_port INT DEFAULT 8728,
        username VARCHAR(255) NOT NULL,
        password VARCHAR(500) NOT NULL DEFAULT '',
        description TEXT,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS router_connections (
        id INT AUTO_INCREMENT PRIMARY KEY,
        router_id INT NOT NULL,
        is_connected BOOLEAN DEFAULT 0,
        last_connected DATETIME,
        last_disconnected DATETIME,
        error_message TEXT,
        FOREIGN KEY (router_id) REFERENCES routers(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    console.log('[DB] MySQL Database initialized:', dbName);
    return true;
  } catch (err) {
    console.error('[DB] Failed to initialize MySQL:', err.message);
    throw err;
  }
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
async function addRouter(data) {
  try {
    const encryptedPassword = data.password ? encryptPassword(data.password) : encryptPassword('');

    const [result] = await pool.query(`
      INSERT INTO routers (name, ip_address, mac_address, api_port, username, password, description)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      data.name,
      data.ip_address,
      data.mac_address || null,
      data.api_port || 8728,
      data.username,
      encryptedPassword,
      data.description || null
    ]);

    // Create connection record
    await pool.query(`
      INSERT INTO router_connections (router_id, is_connected)
      VALUES (?, 0)
    `, [result.insertId]);

    console.log('[DB] Router added:', data.name, '(ID:', result.insertId, ')');
    return { success: true, id: result.insertId };
  } catch (err) {
    console.error('[DB] Error adding router:', err.message);
    if (err.code === 'ER_DUP_ENTRY') {
      return { success: false, error: 'IP address sudah terdaftar di database' };
    }
    return { success: false, error: err.message };
  }
}

/**
 * Get all active routers with connection status
 */
async function getAllRouters() {
  try {
    const [routers] = await pool.query(`
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
async function getRouterById(id, includePassword = false) {
  try {
    const [rows] = await pool.query(`
      SELECT r.*, 
             rc.is_connected, 
             rc.last_connected, 
             rc.last_disconnected, 
             rc.error_message
      FROM routers r
      LEFT JOIN router_connections rc ON r.id = rc.router_id
      WHERE r.id = ? AND r.is_active = 1
    `, [id]);

    if (rows.length === 0) return null;
    const router = rows[0];

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
async function updateRouter(id, data) {
  try {
    let query, params;

    if (data.password && data.password !== '********') {
      // Password changed - encrypt the new one
      const encryptedPassword = encryptPassword(data.password);
      query = `
        UPDATE routers 
        SET name = ?, ip_address = ?, mac_address = ?, api_port = ?, username = ?, password = ?, description = ?
        WHERE id = ? AND is_active = 1
      `;
      params = [data.name, data.ip_address, data.mac_address || null, data.api_port || 8728, data.username, encryptedPassword, data.description || null, id];
    } else {
      // Password not changed
      query = `
        UPDATE routers 
        SET name = ?, ip_address = ?, mac_address = ?, api_port = ?, username = ?, description = ?
        WHERE id = ? AND is_active = 1
      `;
      params = [data.name, data.ip_address, data.mac_address || null, data.api_port || 8728, data.username, data.description || null, id];
    }

    const [result] = await pool.query(query, params);

    if (result.affectedRows === 0) {
      return { success: false, error: 'Router tidak ditemukan' };
    }

    console.log('[DB] Router updated: ID', id);
    return { success: true };
  } catch (err) {
    console.error('[DB] Error updating router:', err.message);
    if (err.code === 'ER_DUP_ENTRY') {
      return { success: false, error: 'IP address sudah digunakan router lain' };
    }
    return { success: false, error: err.message };
  }
}

/**
 * Soft delete router (set is_active = 0)
 */
async function deleteRouter(id) {
  try {
    const [result] = await pool.query(`
      UPDATE routers SET is_active = 0 WHERE id = ?
    `, [id]);

    if (result.affectedRows === 0) {
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
async function updateConnectionStatus(routerId, isConnected, errorMessage = null) {
  try {
    // Build MySQL compatible datetime format (YYYY-MM-DD HH:MM:SS)
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

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

    await pool.query(query, params);
    console.log(`[DB] Connection status updated: Router ${routerId} -> ${isConnected ? 'Connected' : 'Disconnected'}`);
  } catch (err) {
    console.error('[DB] Error updating connection status:', err.message);
  }
}

/**
 * Get all active router configs with decrypted passwords (for auto-connect)
 */
async function getAllRouterConfigs() {
  try {
    const [rows] = await pool.query(`
      SELECT id, name, ip_address, api_port, username, password
      FROM routers WHERE is_active = 1
    `);

    return rows.map(r => ({
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
async function closeDatabase() {
  if (pool) {
    await pool.end();
    console.log('[DB] MySQL Database connection closed');
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
