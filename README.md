# MikroTik ISP Billing & Management System (Vue 3 + Node.js)

Sistem Informasi Manajemen ISP dan RT/RW Net berskala profesional (Full-Stack Web App) untuk mengelola jaringan Router MikroTik secara menyeluruh. Dibangun menggunakan **Vue.js 3** untuk antarmuka interaktif dan **Node.js (Express)** sebagai *backend server* terpusat, menggantikan arsitektur Electron sebelumnya.

Sistem ini dirancang untuk otomasi ISP penuh: mulai dari sinkronisasi *PPPoE User* langsung ke MikroTik, pembuatan tagihan (*Invoice*) otomatis tiap bulan, pengiriman pesan via *WhatsApp Bot*, hingga pembayaran tagihan *real-time* dengan *Payment Gateway (Xendit)*.

---

## ✨ Fitur Unggulan (Core Features)

### 1. ⚙️ Otomatisasi Tagihan & Isolasi (Auto-Billing & Scheduler)
- **Generate Invoice Otomatis:** Sistem berjalan di *background* (*Cron Job*) yang akan secara otomatis membuat tagihan bulanan baru pada tanggal cetak tagihan pelanggan.
- **Auto-Isolasi / Suspend:** Mematikan (*disable*) koneksi PPPoE *Secret* langsung di Router MikroTik secara otomatis jika pelanggan belum membayar hingga melewati batas jatuh tempo (Grace Period).
- **Auto-Aktivasi:** Menghidupkan (*enable*) kembali koneksi internet secara *real-time* begitu pelanggan selesai melakukan pelunasan tagihan.

### 2. 💸 Integrasi Payment Gateway (Xendit)
- Mendukung metode pembayaran modern: **Virtual Account (BCA, Mandiri, BNI, dll)**, **QRIS**, dan **E-Wallet (OVO, DANA, ShopeePay)**.
- Menggunakan arsitektur *HTTP API Murni* yang di-desain tangguh (*resilient*) dengan mekanisme **Real-time Status Polling** (Fallback Webhook) sehingga konfirmasi lunas terjadi tanpa penundaan (*delay*)—bahkan saat berjalan di *localhost*.

### 3. 🤖 WhatsApp Bot Notification (wwebjs)
Terintegrasi secara internal dengan WhatsApp Web JS untuk mengirimkan notifikasi:
- **Pesan Tagihan Baru:** Otomatis dikirim saat invoice di-generate, lengkap dengan link pembayaran (Customer Portal).
- **Reminder Jatuh Tempo:** Peringatan H-1 atau H-3 sebelum internet diisolasi.
- **Tanda Terima (Receipt):** Bukti pembayaran lunas akan langsung masuk ke WhatsApp pelanggan.

### 4. 🌐 Customer Portal (Dashboard Pelanggan)
Halaman khusus terpisah yang dapat diakses oleh pelanggan menggunakan No. HP / Username mereka untuk:
- Memantau detail paket berlangganan.
- Melihat status tagihan (Lunas / Menunggu / Overdue).
- Membayar langsung dengan sekali klik via antarmuka Xendit.
- Didesain dengan tema modern **Premium Glassmorphism** (responsif di HP dan PC).

### 5. 📈 Real-time MikroTik Monitoring
- **Traffic Graph:** Pemantauan *bandwidth* antarmuka (Rx/Tx) secara visual dan *real-time* (live) menggunakan *Vue-Chart.js*.
- **Resource Monitor:** Indikator langsung untuk beban CPU, *Memory*, dan *Uptime* dari multi-router.
- **Hybrid PPPoE Sync:** Perubahan paket, nama pengguna, atau kata sandi langsung disinkronkan (*push*) ke `/ppp/secret` dan `/ppp/profile` di Mikrotik.

---

## 🛠️ Teknologi Utama

| Bagian | Teknologi / Library |
| :--- | :--- |
| **Frontend (UI)** | Vue.js 3, Vite, Vanilla CSS (Glassmorphism), Chart.js |
| **Backend API** | Node.js, Express.js |
| **Database** | MySQL (via `mysql2`) |
| **Authentication** | JWT (JSON Web Token) + Bcrypt |
| **Router Connect** | MikroTik RouterOS API (`routeros-client`) |
| **Notifikasi** | WhatsApp Web JS (`whatsapp-web.js`) |
| **Payment Gateway** | Xendit API |

---

## 🚀 Cara Instalasi & Menjalankan (Local Development)

### Prasyarat:
- **Node.js** (v18 atau v20+)
- **MySQL Database Server** (XAMPP / Laragon / Native)
- Akun Xendit (Untuk fitur pembayaran otomatis)

### Langkah Instalasi:

1. **Clone & Install Dependencies**
   ```bash
   git clone https://github.com/mudio24/billing-rt-rw.net-connection-routeos.git
   cd billing-rt-rw.net-connection-routeos
   npm install
   ```

2. **Konfigurasi Environment (.env)**
   Buat file `.env` di direktori utama dan sesuaikan konfigurasi Anda:
   ```env
   # SERVER
   PORT=3000
   PORTAL_URL=http://localhost:5173

   # DATABASE MYSQL
   DB_HOST=127.0.0.1
   DB_USER=root
   DB_PASS=
   DB_NAME=mikrotik_manager

   # SECURITY
   JWT_SECRET=rahasia_super_aman_anda

   # XENDIT PAYMENT GATEWAY
   XENDIT_SECRET_KEY=xnd_development_...
   XENDIT_WEBHOOK_TOKEN=...
   XENDIT_BASE_URL=https://api.xendit.co
   ```

3. **Buat Database**
   Buat database kosong bernama `mikrotik_manager` pada server MySQL Anda. Skema tabel akan otomatis di-migrate (dibuat) oleh sistem saat backend pertama kali dijalankan.

4. **Jalankan Aplikasi (Concurrent Mode)**
   Sistem akan secara serentak (*concurrently*) menjalankan **Node.js Backend (Port 3000)** dan **Vue.js Frontend (Port 5173)**:
   ```bash
   npm run dev
   ```

5. **Akses Dashboard**
   - Halaman Admin & Pelanggan: `http://localhost:5173`
   - *Default Login Admin*: Pertama kali, akan otomatis masuk proses setup / database akan disinkronisasi.

---

## 📁 Struktur Direktori Utama
Proyek ini mengadopsi standar industri pemisahan *backend* dan *frontend* (Monorepo Node.js & Vue 3). Semua peninggalan *Electron* dan skrip *legacy* telah dibersihkan sepenuhnya.

```text
mikrotik-app/
├── server/                 # Murni Backend (Node.js + Express)
│   ├── index.js            # Entry-point Server & Cron Jobs
│   ├── routes/             # API Controllers (customers, invoices, whatsapp, dsb)
│   ├── services/           # Business Logic (xendit, mikrotik, database)
│   └── migrations/         # Skema tabel MySQL (Auto-migrate)
├── src/                    # Murni Frontend (Vue 3 + Vite)
│   ├── App.vue             # Entry-point UI Utama
│   ├── main.js             
│   ├── style.css           # Global UI Framework (Glassmorphism)
│   └── components/         # Komponen Modular berdasar Domain/Fitur
│       ├── auth/           # Sistem Login
│       ├── portal/         # Dashboard Khusus Pelanggan (Bayar via Xendit)
│       ├── billing/        # Manajemen Keuangan (Admin)
│       ├── dashboard/      # Realtime Monitoring & Chart
│       ├── pppoe/          # Konfigurasi Secret & Profil
│       └── router/         # Pengaturan Koneksi Router
├── .env                    # Variabel Rahasia (Database, API Keys Xendit)
└── package.json            # Daftar Dependencies & Scripts
```

---
_Dibuat dan diperbarui untuk tugas akhir / operasional nyata ISP RT/RW Net._
