# Mikrotik Router Management App (Electron + Vue 3)

Aplikasi desktop profesional untuk mengelola jaringan dan router Mikrotik. Dibangun menggunakan arsitektur modern **Electron**, **Vue.js 3**, dan **MySQL** sebagai sentral penyimpanan database *billing* dan manajemen. Aplikasi ini dirancang agar pengguna dapat melakukan koneksi secara *real-time* ke router Mikrotik menggunakan MikroTik API Service.

## ✨ Pembaruan Terbaru
- **Migrasi Database ke MySQL:** Sistem database telah beralih dari SQLite ke **MySQL**, memungkinkan pengelolaan *billing* yang lebih tersentralisasi, stabil, dan bisa diperluas menjadi web-app.
- **Dashboard & Real-time Monitoring:** Penambahan halaman muka interaktif yang menampilkan *Traffic Graph* (Grafik Bandwidth Rx/Tx) secara mulus *(Realtime)* menggunakan *Vue-Chart.js*, serta status Resource Router (CPU, Memory, Uptime).
- **PPPoE Management (Hybrid Sync):** Mendukung fitur CRUD untuk *PPPoE User (Secrets)* dan *Service Profiles*. Profil dilengkapi form input *Pricing/Billing* yang tersimpan di MySQL lokal, yang digabungkan otomatis *(hybrid)* dengan konfigurasi riil di Router MikroTik.
- **Dynamic Datalist IP Pools:** Form IP *Local/Remote Address* dilengkapi *dropdown* cerdas terintegrasi API MikroTik untuk memilih rute IP Pool secara langsung.

## Fitur Utama Lainnya

- 🌐 **Real-time Connectivity:** Memonitor status online/offline setiap router Mikrotik secara langsung.
- 🔐 **Secure Storage:** Penyimpanan kredensial secara efisien, mendukung koneksi otomatis saat aplikasi dijalankan.
- 🎨 **Clean UI/UX:** Desain *Glassmorphism* modern dengan tema gelap *(Dark Mode)* yang terintegrasi penuh. Semua komponen UI dirancang agar nyaman di mata.
- 🔍 **Pencarian Cepat & Cetak PDF:** Pencarian filter langsung *(Live Search)* untuk menemukan router/user, serta fitur Cetak Laporan Tabel khusus yang membersihkan *Sidebar* ketika masuk ke format kertas/PDF.
- 🗔 **Zoom Kontrol:** Dukungan fitur memperbesar dan memperkecil UI via shortcut keyboard (`Ctrl +`, `Ctrl -`) dan scroll mouse.

## Teknologi yang Digunakan

| Komponen | Teknologi |
| :--- | :--- |
| **Framework UI** | Vue.js 3 (Vite) |
| **Desktop Shell** | Electron |
| **Database** | MySQL Server (via `mysql2`) |
| **Charting Library** | Chart.js / vue-chartjs |
| **Styling** | Vanilla CSS (Glassmorphism UI) |
| **Integrasi API** | MikroTik RouterOS API (`routeros-client`) |

## Prasyarat (Requirements)

Pastikan di komputermu sudah ter-install:
1. **Node.js** (rekomendasi: v18 LTS atau v20 LTS)
2. **NPM** atau **Yarn**
3. **Database Server MySQL** (Misal: XAMPP, Laragon, MySQL Server) dengan database bernama `mikrotik_manager`.

> [!NOTE]
> Aplikasi ini memerlukan *database* MySQL agar bisa berjalan penuh. Jika tabel MySQL belum tersedia di dalam server lokal Anda, sistem (Node JS / Electron) secara ajaib akan membuatkan seluruh struktur tabel secara otomatis saat aplikasi pertama kali djalankan (*Auto-Migrate*).

## Instalasi & Cara Menjalankan

1. Clone repository ini:
   ```bash
   git clone https://github.com/mudio24/billing-rt-rw.net-connection-routeos.git
   cd billing-rt-rw.net-connection-routeos
   ```

2. Jalankan proses install untuk mengunduh semua ekstensi Vue dan Electron:
   ```bash
   npm install
   ```

3. Setup Database Anda:
   Buat database kosong bernama `mikrotik_manager` pada MySQL server Anda. Pastikan MySQL berjalan dengan *user* `root` dan tanpa kata sandi (*default* XAMPP/Laragon). Konfigurasi kredensial DB dapat diubah langsung di `electron/services/db-service.js`.

4. Jalankan server development (Vite + Electron):
   ```bash
   npm run electron:dev
   ```

## Struktur Proyek Utama

- `electron/` : Source code *Main Process Electron*, berisi File-file IPC (Inter-Process Communication), API Router MikroTik, dan Engine Database MySQL.
- `src/` : Kumpulan logika Frontend (Vue.js) yang bertugas merender UI dan grafik chart.
- `database.sql` : *(Optional)* Skema database manual jika dibutuhkan.

## Build / Produksi

Untuk melakukan proses *packaging* menjadi aplikasi instalable (seperti `.exe` untuk Windows), kamu perlu menyiapkan konfigurasi build melalui `package.json` menggunakan `electron-builder`, lalu jalankan:

```bash
npm run electron:build
```

## Troubleshooting Koneksi Mikrotik

Jika mengalami pesan error seperti `ETIMEDOUT: Connection timeout` saat menghubungkan Mikrotik:
- Cek ketersediaan koneksi jaringan kamu dengan router. Pastikan IP Router bisa di-ping.
- Pastikan Service **API (port bawaan 8728)** di dalam router Mikrotik sudah berstatus **Enabled**. (Cek di menu `IP` -> `Services`).
- Jika router terhalang Firewall mikrotik, pastikan *Address List* untuk service API di MikroTik mengizinkan alamat IP Anda.

---
_dibuat untuk draf skripsi, Bissmillah_
