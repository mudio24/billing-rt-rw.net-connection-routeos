# Mikrotik Router Management App (Electron + Vue 3)

Aplikasi desktop profesional untuk mengelola daftar router Mikrotik. Dibangun menggunakan arsitektur modern **Electron**, **Vue.js 3**, dan **SQLite** sebagai penyimpanan database lokal yang super cepat dan responsif. Aplikasi ini dirancang agar pengguna dapat melakukan koneksi secara *real-time* ke router Mikrotik menggunakan MikroTik API Service.

## Fitur Utama

- 🌐 **Real-time Connectivity:** Memonitor status online/offline setiap router Mikrotik secara langsung.
- 💾 **Local Database:** Penyimpanan aman router, IP address, username, MAC address di database SQLite lokal (`better-sqlite3`).
- 🔐 **Secure Storage:** Penyimpanan kredensial secara efisien, mendukung koneksi otomatis saat aplikasi dijalankan.
- ✨ **Clean UI/UX:** Desain *Glassmorphism* modern dengan tema gelap yang elegan dan responsif, menghilangkan ketergantungan pada ikon emoji demi desain yang lebih enterprise.
- 🔍 **Pencarian Cepat:** Pencarian filter langsung (Live Search) untuk menemukan router berdasarkan nama atau IP address.
- 📋 **Copy to Clipboard:** Salin IP Address router secara otomatis melalui UI.
- 🗔 **Zoom Kontrol:** Dukungan fitur memperbesar dan memperkecil UI via shortcut keyboard (`Ctrl +`, `Ctrl -`) dan scroll mouse.

## Teknologi yang Digunakan

| Komponen | Teknologi |
| :--- | :--- |
| **Framework UI** | Vue.js 3 (Vite) |
| **Desktop Shell** | Electron |
| **Database Lokal** | SQLite3 (`better-sqlite3`) |
| **Styling** | Vanilla CSS (Glassmorphism UI) |
| **Integrasi API** | MikroTik RouterOS API |

## Prasyarat (Requirements)

Pastikan di komputermu sudah ter-install:
1. **Node.js** (rekomendasi: v18 LTS atau v20 LTS)
2. **NPM** atau **Yarn**

> [!NOTE]
> Aplikasi ini memerlukan file native backend yang dicompile sesuai versi Sistem Operasi. Jika Anda mengkloning repository ini, pastikan menjalankan langkah instalasi di bawah ini dengan benar agar dependencies node dikompilasi ulang sesuai environment lokal Anda.

## Instalasi & Cara Menjalankan

1. Clone repository ini:
   ```bash
   git clone https://github.com/mudio24/billing-rt-rw.net-connection-routeos.git
   cd billing-rt-rw.net-connection-routeos
   ```

2. Jika ada direktori lama dengan nama mikrotik-app yang disalin di sini, pastikan kamu berada pada *root folder* projectnya. Karena ini menggunakan dependensi native binding seperti `better-sqlite3`, lakukan proses install untuk mengunggah dependencies:
   ```bash
   npm install
   ```
   > _Catatan: Jika terjadi error mengenai bentrok versi node ABI (NODE_MODULE_VERSION), jalankan `npm rebuild` atau hapus folder `node_modules` lalu ulangi `npm install`._

3. Jalankan server development (Vite + Electron):
   ```bash
   npm run electron:dev
   ```

## Struktur Proyek Utama

- `electron/` : Source code Main Process Electron, termasuk Service API Router, Database initialization, dan pembersihan port.
- `src/` : Frontend Vue.js code (komponen antarmuka, CSS, dan logika tampilan).
- `data/` : Tempat penyimpanan otomatis file database `app.db`. (Diabaikan oleh gitignore)

## Build / Produksi

Untuk melakukan proses *packaging* menjadi aplikasi instalable (seperti .exe untuk Windows), kamu perlu menyiapkan konfigurasi build melalui `package.json` menggunakan `electron-builder` (jika sudah dikonfigurasi), lalu jalankan:

```bash
npm run electron:build
```

## Troubleshooting Koneksi Mikrotik

Jika mengalami pesan error seperti `ETIMEDOUT: Connection timeout` saat menghubungkan Mikrotik:
- Cek ketersediaan koneksi jaringan kamu dengan router. Pastikan IP Router bisa diping.
- Pastikan Service **API (port bawaan 8728)** di dalam router Mikrotik sudah berstatus **Enabled**. (Cek di menu `IP` -> `Services`).
- Jika router terhalang Firewall mikrotik, pastikan *Address List* untuk service API di MikroTik mengizinkan alamat IP dari rentang `0.0.0.0/0` atau IP statis komputermu.

---
_dibuat untuk draf skripsi, Bissmillah_
