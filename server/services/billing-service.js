/**
 * Billing Service
 * Handles all billing-related database operations
 */

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

class BillingService {
  constructor() {
    this.pool = null;
  }

  async init(pool) {
    this.pool = pool;
    await this.runMigrations();
    await this.ensureDefaultAdmin();
  }

  async runMigrations() {
    const migrationsDir = path.join(__dirname, '..', 'migrations');
    if (!fs.existsSync(migrationsDir)) return;

    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
    
    for (const file of files) {
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      
      const statements = sql
        .replace(/--.*$/gm, '')
        .split(/;\s*\n/)
        .map(s => s.trim())
        .filter(s => s.length > 5);

      for (const stmt of statements) {
        try {
          await this.pool.query(stmt);
        } catch (err) {
          if (err.code !== 'ER_TABLE_EXISTS_ERROR' && err.code !== 'ER_DUP_ENTRY') {
            console.error(`[Billing] Migration error in ${file}:`, err.message, '\nStatement:', stmt.substring(0, 80));
          }
        }
      }
    }
    console.log('[Billing] Database migrations completed');
  }

  async ensureDefaultAdmin() {
    const [rows] = await this.pool.execute('SELECT id FROM users WHERE username = ?', ['admin']);
    if (rows.length === 0) {
      const hash = await bcrypt.hash('admin123', 10);
      await this.pool.execute(
        'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
        ['admin', hash, 'admin']
      );
      console.log('[Billing] Default admin created (admin / admin123)');
    }
  }

  // ==========================================
  // AUTH
  // ==========================================
  async authenticateUser(username, password) {
    const [rows] = await this.pool.execute(
      'SELECT * FROM users WHERE username = ? AND is_active = TRUE', [username]
    );
    if (rows.length === 0) return null;

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return null;

    return { id: user.id, username: user.username, role: user.role, customer_id: user.customer_id };
  }

  async getUserById(id) {
    const [rows] = await this.pool.execute(
      'SELECT id, username, role, customer_id, is_active, created_at FROM users WHERE id = ?', [id]
    );
    return rows[0] || null;
  }

  async createUser(username, password, role, customerId = null) {
    const hash = await bcrypt.hash(password, 10);
    const [result] = await this.pool.execute(
      'INSERT INTO users (username, password, role, customer_id) VALUES (?, ?, ?, ?)',
      [username, hash, role, customerId]
    );
    return result.insertId;
  }

  // ==========================================
  // PACKAGES
  // ==========================================
  async getAllPackages() {
    const [rows] = await this.pool.execute('SELECT * FROM packages ORDER BY price ASC');
    return rows;
  }

  async getPackageById(id) {
    const [rows] = await this.pool.execute('SELECT * FROM packages WHERE id = ?', [id]);
    return rows[0] || null;
  }

  async createPackage(data) {
    const isActive = data.is_active !== false;
    const [result] = await this.pool.execute(
      'INSERT INTO packages (name, pppoe_profile, speed_up, speed_down, price, description, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [data.name, data.pppoe_profile, data.speed_up, data.speed_down, data.price, data.description || null, isActive]
    );
    return result.insertId;
  }

  async updatePackage(id, data) {
    await this.pool.execute(
      'UPDATE packages SET name=?, pppoe_profile=?, speed_up=?, speed_down=?, price=?, description=?, is_active=? WHERE id=?',
      [data.name, data.pppoe_profile, data.speed_up, data.speed_down, data.price, data.description || null, data.is_active !== false, id]
    );
  }

  async deletePackage(id) {
    // Check if package is in use
    const [rows] = await this.pool.execute('SELECT id FROM customers WHERE package_id = ?', [id]);
    if (rows.length > 0) throw new Error('Paket masih digunakan oleh pelanggan');
    await this.pool.execute('DELETE FROM packages WHERE id = ?', [id]);
  }

  /**
   * Sync packages from MikroTik PPPoE profiles
   * @param {Array} profiles 
   */
  async syncPackagesFromRouter(profiles) {
    let synced = 0;
    let ignored = 0;

    for (const profile of profiles) {
      if (profile.name === 'default' || profile.name === 'default-encryption') continue;

      // Check if profile already exists in DB
      const [existing] = await this.pool.execute(
        'SELECT id FROM packages WHERE pppoe_profile = ?',
        [profile.name]
      );

      if (existing.length > 0) {
        ignored++;
        continue;
      }

      // Try to parse speed from rate-limit (e.g. "5M/5M")
      let speedUp = '1M';
      let speedDown = '1M';
      if (profile['rate-limit']) {
        const parts = profile['rate-limit'].split('/');
        if (parts.length === 2) {
          speedUp = parts[0].trim();
          speedDown = parts[1].trim();
        }
      }

      await this.pool.execute(
        'INSERT INTO packages (name, pppoe_profile, speed_up, speed_down, price, description) VALUES (?, ?, ?, ?, ?, ?)',
        [
          profile.name, // Use profile name as package name initially
          profile.name,
          speedUp,
          speedDown,
          0, // Default price 0, user needs to edit later
          `Diimpor dari MikroTik`
        ]
      );

      synced++;
    }

    return { synced, ignored };
  }


  // ==========================================
  // CUSTOMERS
  // ==========================================
  async getAllCustomers() {
    const [rows] = await this.pool.execute(`
      SELECT c.*, p.name as package_name, p.price as package_price, 
             p.speed_up, p.speed_down, p.pppoe_profile
      FROM customers c
      LEFT JOIN packages p ON c.package_id = p.id
      ORDER BY c.created_at DESC
    `);
    return rows;
  }

  async getCustomerById(id) {
    const [rows] = await this.pool.execute(`
      SELECT c.*, p.name as package_name, p.price as package_price,
             p.speed_up, p.speed_down, p.pppoe_profile
      FROM customers c
      LEFT JOIN packages p ON c.package_id = p.id
      WHERE c.id = ?
    `, [id]);
    return rows[0] || null;
  }

  async getCustomerByPppoeUsername(username) {
    const [rows] = await this.pool.execute(
      'SELECT * FROM customers WHERE pppoe_username = ?', [username]
    );
    return rows[0] || null;
  }

  /**
   * Sync customers from MikroTik secrets
   * @param {number} routerId 
   * @param {Array} secrets 
   * @param {Array} packages 
   */
  async syncCustomersFromRouter(routerId, secrets, packages) {
    let synced = 0;
    let ignored = 0;

    for (const secret of secrets) {
      // 1. Check if username already exists in DB
      const [existing] = await this.pool.execute(
        'SELECT id FROM customers WHERE pppoe_username = ? AND router_id = ?',
        [secret.name, routerId]
      );

      if (existing.length > 0) {
        ignored++;
        continue;
      }

      // 2. Try to find matching package by profile name
      let packageId = null;
      const secretProfile = secret.profile || 'default';
      const matchingPackage = packages.find(p => {
        const pProfile = p.pppoe_profile || '';
        const pName = p.name || '';
        return pProfile.toLowerCase() === secretProfile.toLowerCase() ||
               pName.toLowerCase() === secretProfile.toLowerCase();
      });

      if (matchingPackage) {
        packageId = matchingPackage.id;
      } else {
        // Create a temporary package if none exists? 
        // No, better to just pick the first available or leave it null (but package_id is NOT NULL in schema)
        if (packages && packages.length > 0) {
          packageId = packages[0].id;
        } else {
          // If no packages at all, we might need to create one or fail
          throw new Error('Tidak ada paket internet yang tersedia. Buat minimal 1 paket dulu di menu Paket Internet sebelum sinkronisasi.');
        }
      }

      // 3. Create customer record
      const joinDate = new Date().toISOString().split('T')[0];
      const billingDate = 1; // Default to 1st of month

      await this.pool.execute(
        `INSERT INTO customers (name, phone, address, pppoe_username, router_id, package_id, billing_date, join_date, notes, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          secret.name, // Use username as name initially
          '0',        // Placeholder phone
          secret.comment || 'Imported from MikroTik',
          secret.name,
          routerId,
          packageId,
          billingDate,
          joinDate,
          `Imported: ${new Date().toLocaleString()}`,
          secret.disabled === 'true' ? 'suspended' : 'active'
        ]
      );

      // 4. Create portal user
      const [newCustomer] = await this.pool.execute('SELECT id FROM customers WHERE pppoe_username = ?', [secret.name]);
      if (newCustomer.length > 0) {
        const customerId = newCustomer[0].id;
        const defaultPassword = '123'; // Default password for sync
        const hash = await bcrypt.hash(defaultPassword, 10);
        await this.pool.execute(
          'INSERT IGNORE INTO users (username, password, role, customer_id) VALUES (?, ?, ?, ?)',
          [secret.name, hash, 'pelanggan', customerId]
        );
      }

      synced++;
    }

    return { synced, ignored };
  }


  async createCustomer(data) {
    const joinDate = data.join_date || new Date().toISOString().split('T')[0];
    const billingDate = new Date(joinDate).getDate(); // Tanggal aktivasi = tanggal tagihan

    const [result] = await this.pool.execute(
      `INSERT INTO customers (name, phone, address, pppoe_username, router_id, package_id, billing_date, join_date, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.name, data.phone, data.address || null, data.pppoe_username, data.router_id, data.package_id, billingDate, joinDate, data.notes || null]
    );

    // Auto-create login user for pelanggan
    const customerId = result.insertId;
    const defaultPassword = data.phone.slice(-6); // 6 digit terakhir no HP
    await this.createUser(data.pppoe_username, defaultPassword, 'pelanggan', customerId);

    return customerId;
  }

  async updateCustomer(id, data) {
    // If join_date is provided, update billing_date as well
    if (data.join_date) {
      const billingDate = new Date(data.join_date).getDate();
      await this.pool.execute(
        `UPDATE customers SET name=?, phone=?, address=?, package_id=?, notes=?, status=?, join_date=?, billing_date=? WHERE id=?`,
        [data.name, data.phone, data.address || null, data.package_id, data.notes || null, data.status || 'active', data.join_date, billingDate, id]
      );
    } else {
      await this.pool.execute(
        `UPDATE customers SET name=?, phone=?, address=?, package_id=?, notes=?, status=? WHERE id=?`,
        [data.name, data.phone, data.address || null, data.package_id, data.notes || null, data.status || 'active', id]
      );
    }
  }

  async deleteCustomer(id) {
    // Delete related records
    await this.pool.execute('DELETE FROM payment_logs WHERE invoice_id IN (SELECT id FROM invoices WHERE customer_id = ?)', [id]);
    await this.pool.execute('DELETE FROM invoices WHERE customer_id = ?', [id]);
    await this.pool.execute('DELETE FROM scheduler_logs WHERE customer_id = ?', [id]);
    await this.pool.execute('DELETE FROM users WHERE customer_id = ?', [id]);
    await this.pool.execute('DELETE FROM customers WHERE id = ?', [id]);
  }

  async suspendCustomer(id) {
    await this.pool.execute('UPDATE customers SET status = ? WHERE id = ?', ['suspended', id]);
  }

  async activateCustomer(id) {
    await this.pool.execute('UPDATE customers SET status = ? WHERE id = ?', ['active', id]);
  }

  // ==========================================
  // INVOICES
  // ==========================================
  async generateInvoiceNumber() {
    const now = new Date();
    const prefix = 'INV';
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    const [rows] = await this.pool.execute(
      'SELECT COUNT(*) as count FROM invoices WHERE invoice_number LIKE ?',
      [`${prefix}-${yearMonth}%`]
    );
    const seq = String((rows[0].count || 0) + 1).padStart(3, '0');
    return `${prefix}-${yearMonth}-${seq}`;
  }

  async createInvoice(customerId) {
    const customer = await this.getCustomerById(customerId);
    if (!customer) throw new Error('Pelanggan tidak ditemukan');

    const pkg = await this.getPackageById(customer.package_id);
    if (!pkg) throw new Error('Paket tidak ditemukan');

    // Period start is the anniversary date
    // If we are generating this in advance (e.g. today 23rd for 30th), 
    // we need to find the correct anniversary date.
    let targetYear = now.getFullYear();
    let targetMonth = now.getMonth();
    
    // If today's day is > customer's billing date, the anniversary is next month
    // (e.g. today is 25th, billing date is 1st)
    if (now.getDate() > customer.billing_date) {
      targetMonth++;
    }
    
    const periodStart = new Date(targetYear, targetMonth, customer.billing_date);
    const periodEnd = new Date(targetYear, targetMonth + 1, customer.billing_date - 1);

    const [existing] = await this.pool.execute(
      'SELECT id FROM invoices WHERE customer_id = ? AND period_start = ? AND status != ?',
      [customerId, periodStart.toISOString().split('T')[0], 'cancelled']
    );
    const dueDays = parseInt(await this.getSetting('billing_due_days') || '0');
    const dueDate = new Date(periodStart);
    if (dueDays > 0) {
      dueDate.setDate(dueDate.getDate() + dueDays);
    }

    const invoiceNumber = await this.generateInvoiceNumber();

    const [result] = await this.pool.execute(
      `INSERT INTO invoices (invoice_number, customer_id, package_id, amount, period_start, period_end, due_date)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [invoiceNumber, customerId, customer.package_id, pkg.price, 
       periodStart.toISOString().split('T')[0], 
       periodEnd.toISOString().split('T')[0],
       dueDate.toISOString().split('T')[0]]
    );

    return { id: result.insertId, invoiceNumber, amount: pkg.price, dueDate };
  }

  async getInvoices(filters = {}) {
    let query = `
      SELECT i.*, c.name as customer_name, c.phone as customer_phone,
             c.pppoe_username, p.name as package_name
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.id
      LEFT JOIN packages p ON i.package_id = p.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.customerId) {
      query += ' AND i.customer_id = ?';
      params.push(filters.customerId);
    }
    if (filters.status) {
      query += ' AND i.status = ?';
      params.push(filters.status);
    }
    if (filters.invoice_number) {
      query += ' AND i.invoice_number = ?';
      params.push(filters.invoice_number);
    }

    query += ' ORDER BY i.created_at DESC';

    if (filters.limit) {
      query += ` LIMIT ${parseInt(filters.limit)}`;
    }

    const [rows] = await this.pool.execute(query, params);
    return rows;
  }

  async getInvoiceById(id) {
    const [rows] = await this.pool.execute(`
      SELECT i.*, c.name as customer_name, c.phone as customer_phone,
             c.pppoe_username, c.address as customer_address,
             p.name as package_name, p.speed_up, p.speed_down
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.id
      LEFT JOIN packages p ON i.package_id = p.id
      WHERE i.id = ?
    `, [id]);
    return rows[0] || null;
  }

  async updateInvoiceXendit(invoiceId, xenditInvoiceId, xenditUrl) {
    await this.pool.execute(
      'UPDATE invoices SET xendit_invoice_id = ?, xendit_invoice_url = ? WHERE id = ?',
      [xenditInvoiceId, xenditUrl, invoiceId]
    );
  }

  async markInvoicePaid(invoiceId, paidVia = 'manual') {
    await this.pool.execute(
      'UPDATE invoices SET status = ?, paid_at = NOW(), paid_via = ? WHERE id = ?',
      ['paid', paidVia, invoiceId]
    );
  }

  async cancelInvoice(invoiceId) {
    await this.pool.execute(
      'UPDATE invoices SET status = ? WHERE id = ?',
      ['cancelled', invoiceId]
    );
  }

  async markInvoiceOverdue(invoiceId) {
    await this.pool.execute(
      'UPDATE invoices SET status = ? WHERE id = ?',
      ['overdue', invoiceId]
    );
  }

  async getOverdueInvoices(graceDays = 3) {
    const [rows] = await this.pool.execute(`
      SELECT i.*, c.name as customer_name, c.phone as customer_phone,
             c.pppoe_username, c.router_id
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.id
      WHERE i.status = 'pending' AND i.due_date < DATE_SUB(CURDATE(), INTERVAL ? DAY)
    `, [graceDays]);
    return rows;
  }

  async getCustomersDueTodayForBilling() {
    // Logic: find customers whose billing_date is X days from now (Lead Time from settings)
    const leadDays = parseInt(await this.getSetting('invoice_lead_days') || '7'); 
    const [rows] = await this.pool.execute(`
      SELECT c.*, p.name as package_name, p.price as package_price
      FROM customers c
      LEFT JOIN packages p ON c.package_id = p.id
      WHERE c.billing_date = DAY(DATE_ADD(CURDATE(), INTERVAL ? DAY)) 
      AND c.status = 'active'
    `, [leadDays]);
    return rows;
  }

  // ==========================================
  // PAYMENT LOGS
  // ==========================================
  async addPaymentLog(invoiceId, eventType, rawData = null) {
    await this.pool.execute(
      'INSERT INTO payment_logs (invoice_id, event_type, raw_data) VALUES (?, ?, ?)',
      [invoiceId, eventType, rawData ? JSON.stringify(rawData) : null]
    );
  }

  // ==========================================
  // SCHEDULER LOGS
  // ==========================================
  async addSchedulerLog(customerId, action, reason, success = true, errorMessage = null) {
    await this.pool.execute(
      'INSERT INTO scheduler_logs (customer_id, action, reason, success, error_message) VALUES (?, ?, ?, ?, ?)',
      [customerId, action, reason, success, errorMessage]
    );
  }

  // ==========================================
  // SETTINGS
  // ==========================================
  async getSetting(key) {
    const [rows] = await this.pool.execute('SELECT setting_value FROM settings WHERE setting_key = ?', [key]);
    return rows[0] ? rows[0].setting_value : null;
  }

  async setSetting(key, value) {
    await this.pool.execute(
      'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
      [key, value, value]
    );
  }

  async getAllSettings() {
    const [rows] = await this.pool.execute('SELECT * FROM settings');
    const settings = {};
    rows.forEach(r => { settings[r.setting_key] = r.setting_value; });
    return settings;
  }

  // ==========================================
  // DASHBOARD STATS
  // ==========================================
  async getDashboardStats() {
    const [totalCustomers] = await this.pool.execute('SELECT COUNT(*) as count FROM customers');
    const [activeCustomers] = await this.pool.execute('SELECT COUNT(*) as count FROM customers WHERE status = ?', ['active']);
    const [suspendedCustomers] = await this.pool.execute('SELECT COUNT(*) as count FROM customers WHERE status = ?', ['suspended']);

    const now = new Date();
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    
    const [monthlyRevenue] = await this.pool.execute(
      'SELECT COALESCE(SUM(amount), 0) as total FROM invoices WHERE status = ? AND paid_at >= ?',
      ['paid', monthStart]
    );

    const [pendingInvoices] = await this.pool.execute(
      'SELECT COUNT(*) as count FROM invoices WHERE status = ?', ['pending']
    );

    const [overdueInvoices] = await this.pool.execute(
      'SELECT COUNT(*) as count FROM invoices WHERE status = ?', ['overdue']
    );

    return {
      totalCustomers: totalCustomers[0].count,
      activeCustomers: activeCustomers[0].count,
      suspendedCustomers: suspendedCustomers[0].count,
      monthlyRevenue: monthlyRevenue[0].total,
      pendingInvoices: pendingInvoices[0].count,
      overdueInvoices: overdueInvoices[0].count
    };
  }

  // ==========================================
  // REVENUE ANALYTICS
  // ==========================================

  /**
   * Revenue summary: totals for paid, pending, overdue within a date range
   */
  async getRevenueSummary(from, to) {
    const [paid] = await this.pool.execute(
      `SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as count
       FROM invoices WHERE status = 'paid' AND paid_at >= ? AND paid_at <= ?`,
      [from, to + ' 23:59:59']
    );
    const [paidToday] = await this.pool.execute(
      `SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as count
       FROM invoices WHERE status = 'paid' AND DATE(paid_at) = CURDATE()`
    );
    const [pending] = await this.pool.execute(
      `SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as count
       FROM invoices WHERE status = 'pending'`
    );
    const [overdue] = await this.pool.execute(
      `SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as count
       FROM invoices WHERE status = 'overdue'`
    );
    return {
      paid: { total: paid[0].total, count: paid[0].count },
      paidToday: { total: paidToday[0].total, count: paidToday[0].count },
      pending: { total: pending[0].total, count: pending[0].count },
      overdue: { total: overdue[0].total, count: overdue[0].count }
    };
  }

  /**
   * Daily revenue breakdown within a date range
   */
  async getRevenueDaily(from, to) {
    const [rows] = await this.pool.execute(
      `SELECT DATE(paid_at) as date, SUM(amount) as total, COUNT(*) as count
       FROM invoices WHERE status = 'paid' AND paid_at >= ? AND paid_at <= ?
       GROUP BY DATE(paid_at) ORDER BY date ASC`,
      [from, to + ' 23:59:59']
    );
    return rows;
  }

  /**
   * Revenue breakdown by package
   */
  async getRevenueByPackage(from, to) {
    const [rows] = await this.pool.execute(
      `SELECT p.name as package_name, SUM(i.amount) as total, COUNT(*) as count
       FROM invoices i
       LEFT JOIN packages p ON i.package_id = p.id
       WHERE i.status = 'paid' AND i.paid_at >= ? AND i.paid_at <= ?
       GROUP BY i.package_id, p.name ORDER BY total DESC`,
      [from, to + ' 23:59:59']
    );
    return rows;
  }

  /**
   * Revenue breakdown by payment method
   */
  async getRevenueByMethod(from, to) {
    const [rows] = await this.pool.execute(
      `SELECT COALESCE(paid_via, 'unknown') as method, SUM(amount) as total, COUNT(*) as count
       FROM invoices WHERE status = 'paid' AND paid_at >= ? AND paid_at <= ?
       GROUP BY paid_via ORDER BY total DESC`,
      [from, to + ' 23:59:59']
    );
    return rows;
  }

  /**
   * Recent payment transactions with filters
   */
  async getRevenueTransactions(filters = {}) {
    let query = `
      SELECT i.id, i.invoice_number, i.amount, i.status, i.paid_at, i.paid_via, i.due_date, i.created_at,
             c.name as customer_name, c.phone as customer_phone,
             p.name as package_name
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.id
      LEFT JOIN packages p ON i.package_id = p.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.from) {
      query += ' AND i.created_at >= ?';
      params.push(filters.from);
    }
    if (filters.to) {
      query += ' AND i.created_at <= ?';
      params.push(filters.to + ' 23:59:59');
    }
    if (filters.status) {
      query += ' AND i.status = ?';
      params.push(filters.status);
    }
    if (filters.method) {
      if (filters.method === 'xendit') {
        query += ' AND i.paid_via LIKE ?';
        params.push('Xendit%');
      } else {
        query += ' AND i.paid_via = ?';
        params.push(filters.method);
      }
    }

    query += ' ORDER BY i.created_at DESC LIMIT 100';

    const [rows] = await this.pool.execute(query, params);
    return rows;
  }

  // ============================================
  // WHATSAPP TEMPLATES
  // ============================================

  async getWaTemplates() {
    const [rows] = await this.pool.execute('SELECT * FROM wa_templates ORDER BY created_at ASC');
    return rows;
  }

  async getWaTemplate(id) {
    const [rows] = await this.pool.execute('SELECT * FROM wa_templates WHERE id = ?', [id]);
    return rows.length ? rows[0] : null;
  }

  async updateWaTemplate(id, data) {
    const { nama_template, isi_pesan } = data;
    await this.pool.execute(
      'UPDATE wa_templates SET nama_template = ?, isi_pesan = ? WHERE id = ?',
      [nama_template, isi_pesan, id]
    );
    return this.getWaTemplate(id);
  }
}

module.exports = new BillingService();
