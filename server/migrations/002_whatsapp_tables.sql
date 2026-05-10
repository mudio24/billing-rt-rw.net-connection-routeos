-- ========================================
-- WhatsApp Gateway Migration
-- ========================================

-- TABEL WA TEMPLATES (Template Pesan WA)
CREATE TABLE IF NOT EXISTS wa_templates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  kode_template VARCHAR(50) UNIQUE NOT NULL,
  nama_template VARCHAR(100) NOT NULL,
  isi_pesan TEXT NOT NULL,
  kategori ENUM('system', 'broadcast') DEFAULT 'broadcast',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default templates
INSERT IGNORE INTO wa_templates (kode_template, nama_template, isi_pesan, kategori) VALUES
  ('tagihan_baru', 'Invoice Tagihan Baru', 'Halo *{{name}}*,\n\nIni adalah tagihan Layanan internet Anda dari *{{company}}*.\n\n*Detail Tagihan:*\n- Invoice: *{{invoice_number}}*\n- Paket: *{{package}}*\n- Periode: *{{period}}*\n- Jumlah: *Rp {{amount}}*\n- Jatuh Tempo: *{{due_date}}*\n\nSilakan klik link berikut untuk melihat detail dan melakukan pembayaran secara online:\n{{payment_link}}\n\nSegera lakukan pembayaran sebelum jatuh tempo untuk menghindari isolir otomatis.\n\nTerima kasih.', 'system'),
  ('reminder_isolir', 'Peringatan Isolir', 'Peringatan Isolir!\n\nHalo *{{name}}*,\nTagihan internet Anda dengan nomor invoice *{{invoice_number}}* telah melewati masa jatuh tempo (*{{due_date}}*).\n\nMohon segera melakukan pembayaran sebesar *Rp {{amount}}* untuk menghindari pemutusan layanan sementara (Isolir) yang akan dilakukan secara otomatis oleh sistem kami dalam 1x24 jam.\n\nLink Pembayaran:\n{{payment_link}}\n\nJika Anda sudah membayar, abaikan pesan ini.', 'system'),
  ('pembayaran_sukses', 'Pembayaran Sukses', 'Terima Kasih!\n\nHalo *{{name}}*,\nPembayaran tagihan internet Anda untuk invoice *{{invoice_number}}* sebesar *Rp {{amount}}* telah berhasil kami terima.\n\nLayanan internet Anda sudah aktif. Terima kasih telah menggunakan layanan dari *{{company}}*.', 'system'),
  ('promo_umum', 'Promo Khusus (Broadcast)', 'Halo *{{name}}*,\n\nDapatkan promo spesial bulan ini! Upgrade kecepatan internet Anda menjadi lebih kencang dengan harga terjangkau.\n\nHubungi admin untuk info lebih lanjut.', 'broadcast'),
  ('maintenance', 'Maintenance Jaringan (Broadcast)', 'Pemberitahuan Maintenance\n\nHalo pelanggan setia *{{company}}*,\nKami informasikan bahwa pada malam ini akan ada pemeliharaan jaringan rutin di wilayah Anda. Mungkin akan terjadi gangguan koneksi sekitar 15-30 menit.\n\nMohon maaf atas ketidaknyamanannya.', 'broadcast');
