-- ========================================
-- Billing System Migration
-- DIONIT CELL - RT/RW Net Manager
-- ========================================

-- TABEL USERS (Login System)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'teknisi', 'pelanggan') DEFAULT 'pelanggan',
  customer_id INT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- TABEL PACKAGES (Paket Internet)
CREATE TABLE IF NOT EXISTS packages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  pppoe_profile VARCHAR(50) NOT NULL,
  speed_up VARCHAR(10) NOT NULL,
  speed_down VARCHAR(10) NOT NULL,
  price INT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABEL CUSTOMERS (Data Pelanggan)
CREATE TABLE IF NOT EXISTS customers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  address TEXT,
  pppoe_username VARCHAR(50) NOT NULL,
  router_id INT NOT NULL,
  package_id INT NOT NULL,
  billing_date INT DEFAULT 1,
  status ENUM('active','suspended','terminated') DEFAULT 'active',
  join_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (package_id) REFERENCES packages(id)
);

-- TABEL INVOICES (Tagihan)
CREATE TABLE IF NOT EXISTS invoices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  invoice_number VARCHAR(20) UNIQUE NOT NULL,
  customer_id INT NOT NULL,
  package_id INT NOT NULL,
  amount INT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  due_date DATE NOT NULL,
  status ENUM('pending','paid','overdue','cancelled') DEFAULT 'pending',
  xendit_invoice_id VARCHAR(100),
  xendit_invoice_url VARCHAR(500),
  paid_at TIMESTAMP NULL,
  paid_via VARCHAR(50),
  wa_notified BOOLEAN DEFAULT FALSE,
  wa_notified_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (package_id) REFERENCES packages(id)
);

-- TABEL PAYMENT LOGS
CREATE TABLE IF NOT EXISTS payment_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  invoice_id INT NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  raw_data JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id)
);

-- TABEL SCHEDULER LOGS
CREATE TABLE IF NOT EXISTS scheduler_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NOT NULL,
  action ENUM('disable','enable') NOT NULL,
  reason VARCHAR(200),
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- TABEL SETTINGS
CREATE TABLE IF NOT EXISTS settings (
  setting_key VARCHAR(50) PRIMARY KEY,
  setting_value TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT IGNORE INTO settings (setting_key, setting_value) VALUES
  ('billing_grace_days', '3'),
  ('company_name', 'DIONIT CELL'),
  ('company_phone', ''),
  ('auto_suspend', 'true'),
  ('invoice_prefix', 'INV');
