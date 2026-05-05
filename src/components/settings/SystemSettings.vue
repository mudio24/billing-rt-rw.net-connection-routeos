<template>
  <div class="system-panel">
    <div class="panel-header">
      <div class="header-left">
        <h2>Pengaturan Sistem</h2>
        <p>Kelola konfigurasi billing, scheduler, dan integrasi WhatsApp Bot.</p>
      </div>
    </div>

    <div class="settings-grid">
      <!-- Billing Settings Card -->
      <div class="card">
        <div class="card-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.32 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          <span>Konfigurasi Billing</span>
        </div>
        <div class="settings-list">
          <div class="setting-row">
            <div class="setting-info">
              <label>Nama Perusahaan</label>
              <span>Ditampilkan di invoice dan notifikasi WA</span>
            </div>
            <input v-model="settings.company_name" type="text" @change="saveSetting('company_name', settings.company_name)" placeholder="DIONIT CELL">
          </div>
          <div class="setting-row">
            <div class="setting-info">
              <label>No. WA Admin</label>
              <span>Nomor yang bisa dihubungi pelanggan</span>
            </div>
            <input v-model="settings.company_phone" type="text" @change="saveSetting('company_phone', settings.company_phone)" placeholder="628xxx">
          </div>
          <div class="setting-row">
            <div class="setting-info">
              <label>Grace Period (Hari)</label>
              <span>Toleransi setelah jatuh tempo sebelum isolir</span>
            </div>
            <input v-model="settings.billing_grace_days" type="number" min="0" max="30" @change="saveSetting('billing_grace_days', settings.billing_grace_days)">
          </div>
          <div class="setting-row">
            <div class="setting-info">
              <label>Auto Suspend</label>
              <span>Otomatis isolir jika lewat grace period</span>
            </div>
            <label class="toggle">
              <input type="checkbox" :checked="settings.auto_suspend === 'true'" @change="toggleAutoSuspend">
              <span class="slider"></span>
            </label>
          </div>
        </div>
      </div>

      <!-- Scheduler Card -->
      <div class="card">
        <div class="card-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <span>Scheduler Otomatis</span>
        </div>
        <div class="scheduler-info">
          <p class="desc">Job scheduler berjalan otomatis setiap hari sesuai jadwal berikut (WIB):</p>
          <div class="schedule-list">
            <div class="schedule-item">
              <span class="time">00:05</span>
              <span class="job">Auto-generate invoice</span>
            </div>
            <div class="schedule-item">
              <span class="time">08:00</span>
              <span class="job">Cek invoice jatuh tempo</span>
            </div>
            <div class="schedule-item">
              <span class="time">09:00</span>
              <span class="job">Auto-isolir pelanggan</span>
            </div>
            <div class="schedule-item">
              <span class="time">10:00</span>
              <span class="job">Kirim pengingat WA</span>
            </div>
          </div>
        </div>
        <div class="scheduler-actions">
          <button class="btn btn-secondary" @click="runInvoices" :disabled="runningJob">
            {{ runningJob === 'invoices' ? 'Memproses...' : '▶ Generate Invoice Manual' }}
          </button>
          <button class="btn btn-secondary" @click="runSuspend" :disabled="runningJob">
            {{ runningJob === 'suspend' ? 'Memproses...' : '▶ Jalankan Auto-Isolir' }}
          </button>
        </div>
      </div>

      <!-- WhatsApp Bot Card -->
      <div class="card card-full">
        <div class="card-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
          <span>WhatsApp Bot</span>
          <span class="badge" :class="waStatus">{{ waStatusText }}</span>
        </div>
        
        <div class="wa-content">
          <div v-if="waData.status === 'disconnected' || waData.status === null" class="wa-disconnected">
            <p>Bot WhatsApp belum aktif. Klik tombol di bawah untuk mulai pairing.</p>
            <button class="btn btn-primary" @click="initWA" :disabled="waLoading">
              {{ waLoading ? 'Menginisialisasi...' : 'Aktifkan Bot WhatsApp' }}
            </button>
          </div>

          <div v-else-if="waData.status === 'qr_pending'" class="wa-qr">
            <p>Scan QR Code ini dengan WhatsApp Anda:</p>
            <div class="qr-wrapper">
              <img :src="waData.qrCode" alt="QR Code WhatsApp" v-if="waData.qrCode">
              <div v-else class="qr-loading">Generating QR...</div>
            </div>
            <p class="qr-hint">Buka WhatsApp > Menu > Linked Devices > Link a Device</p>
          </div>

          <div v-else-if="waData.status === 'ready'" class="wa-ready">
            <div class="wa-connected-badge">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
              <span>WhatsApp Bot Aktif & Terhubung</span>
            </div>

            <div class="wa-test-form">
              <h4>Test Kirim Pesan</h4>
              <div class="test-row">
                <input v-model="testPhone" type="text" placeholder="Nomor WA (628xxx)">
                <input v-model="testMessage" type="text" placeholder="Pesan test...">
                <button class="btn btn-primary btn-sm" @click="sendTest" :disabled="sending">
                  {{ sending ? 'Mengirim...' : 'Kirim' }}
                </button>
              </div>
              <div v-if="testResult" class="test-result" :class="{ success: testResult.success }">
                {{ testResult.success ? '✅ Pesan terkirim!' : '❌ Gagal: ' + testResult.error }}
              </div>
            </div>

            <button class="btn btn-secondary btn-sm" @click="logoutWA" style="margin-top: 16px;">
              Logout & Putuskan Bot
            </button>
          </div>

          <div v-else class="wa-loading">
            <span class="spinner"></span>
            <p>Status: {{ waData.status }}...</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { apiService } from '@/services/api';

export default {
  name: 'SystemSettings',
  data() {
    return {
      settings: {
        company_name: '',
        company_phone: '',
        billing_grace_days: '3',
        auto_suspend: 'true',
        invoice_prefix: 'INV'
      },
      waData: { status: null, qrCode: null },
      waLoading: false,
      waPolling: null,
      testPhone: '',
      testMessage: 'Test pesan dari DIONIT CELL Billing System 🧾',
      testResult: null,
      sending: false,
      runningJob: null
    };
  },
  computed: {
    waStatus() {
      const s = this.waData.status;
      if (s === 'ready') return 'online';
      if (s === 'qr_pending' || s === 'authenticated') return 'warning';
      return 'offline';
    },
    waStatusText() {
      const map = {
        disconnected: 'Tidak Terhubung',
        qr_pending: 'Menunggu Scan QR',
        authenticated: 'Terautentikasi',
        ready: 'Aktif',
        null: 'Tidak Aktif'
      };
      return map[this.waData.status] || this.waData.status;
    }
  },
  async mounted() {
    await this.loadSettings();
    await this.loadWAStatus();
  },
  beforeUnmount() {
    if (this.waPolling) clearInterval(this.waPolling);
  },
  methods: {
    async loadSettings() {
      try {
        const res = await apiService.getSettings();
        if (res.success) {
          this.settings = { ...this.settings, ...res.data };
        }
      } catch (err) {
        console.error('Settings load error:', err);
      }
    },
    async saveSetting(key, value) {
      try {
        await apiService.updateSetting(key, value);
      } catch (err) {
        alert('Gagal menyimpan: ' + err.message);
      }
    },
    toggleAutoSuspend(e) {
      const val = e.target.checked ? 'true' : 'false';
      this.settings.auto_suspend = val;
      this.saveSetting('auto_suspend', val);
    },
    async loadWAStatus() {
      try {
        const res = await apiService.getWhatsAppStatus();
        if (res.success) this.waData = res.data;
      } catch (err) {
        // Bot might not be initialized yet
      }
    },
    async initWA() {
      this.waLoading = true;
      try {
        const res = await apiService.initWhatsApp();
        if (res.success) {
          this.waData = res.data;
          // Start polling for status updates
          this.startWAPolling();
        }
      } catch (err) {
        alert('Gagal menginisialisasi WhatsApp Bot.');
      } finally {
        this.waLoading = false;
      }
    },
    startWAPolling() {
      if (this.waPolling) clearInterval(this.waPolling);
      this.waPolling = setInterval(async () => {
        await this.loadWAStatus();
        if (this.waData.status === 'ready') {
          clearInterval(this.waPolling);
          this.waPolling = null;
        }
      }, 3000);
    },
    async sendTest() {
      this.sending = true;
      this.testResult = null;
      try {
        const res = await apiService.sendTestWhatsApp(this.testPhone, this.testMessage);
        this.testResult = res;
      } catch (err) {
        this.testResult = { success: false, error: err.message };
      } finally {
        this.sending = false;
      }
    },
    async logoutWA() {
      if (!confirm('Logout WhatsApp Bot? Session akan dihapus.')) return;
      try {
        await apiService.logoutWhatsApp();
        this.waData = { status: 'disconnected', qrCode: null };
      } catch (err) {
        alert('Gagal logout.');
      }
    },
    async runInvoices() {
      this.runningJob = 'invoices';
      try {
        const res = await apiService.runInvoiceGeneration();
        alert(res.message || 'Selesai!');
      } catch (err) {
        alert('Gagal: ' + err.message);
      } finally {
        this.runningJob = null;
      }
    },
    async runSuspend() {
      if (!confirm('Jalankan auto-isolir sekarang?')) return;
      this.runningJob = 'suspend';
      try {
        const res = await apiService.runAutoSuspend();
        alert(res.message || 'Selesai!');
      } catch (err) {
        alert('Gagal: ' + err.message);
      } finally {
        this.runningJob = null;
      }
    }
  }
};
</script>

<style scoped>
.system-panel {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.panel-header { display: flex; justify-content: space-between; align-items: center; }
.header-left h2 { font-size: 20px; font-weight: 700; color: var(--text-primary); margin-bottom: 4px; }
.header-left p { font-size: 13px; color: var(--text-muted); }

.settings-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

@media (max-width: 900px) { .settings-grid { grid-template-columns: 1fr; } }

.card {
  background: var(--bg-card);
  border: 1px solid var(--border-card);
  border-radius: 20px;
  padding: 24px;
}

.card-full { grid-column: span 2; }
@media (max-width: 900px) { .card-full { grid-column: span 1; } }

.card-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 20px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--border-subtle);
}

.card-title .badge {
  font-size: 10px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 20px;
  margin-left: auto;
}

.badge.online { background: rgba(34, 197, 94, 0.1); color: #22c55e; }
.badge.warning { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
.badge.offline { background: rgba(239, 68, 68, 0.1); color: #ef4444; }

/* Settings List */
.settings-list { display: flex; flex-direction: column; gap: 16px; }

.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.setting-info { flex: 1; }
.setting-info label { display: block; font-size: 13px; font-weight: 600; color: var(--text-primary); margin-bottom: 2px; }
.setting-info span { font-size: 11px; color: var(--text-muted); }

.setting-row input[type="text"],
.setting-row input[type="number"] {
  width: 200px;
  padding: 8px 12px;
  background: var(--bg-input);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 13px;
}

/* Toggle Switch */
.toggle { position: relative; width: 44px; height: 24px; display: inline-block; }
.toggle input { display: none; }
.slider {
  position: absolute;
  inset: 0;
  background: rgba(100, 116, 139, 0.3);
  border-radius: 24px;
  cursor: pointer;
  transition: 0.3s;
}
.slider::before {
  content: '';
  position: absolute;
  width: 18px;
  height: 18px;
  left: 3px;
  bottom: 3px;
  background: white;
  border-radius: 50%;
  transition: 0.3s;
}
.toggle input:checked + .slider { background: #6366f1; }
.toggle input:checked + .slider::before { transform: translateX(20px); }

/* Scheduler */
.scheduler-info .desc { font-size: 13px; color: var(--text-muted); margin-bottom: 16px; }

.schedule-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; }

.schedule-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: var(--bg-glass);
  border-radius: 8px;
}

.schedule-item .time {
  font-size: 12px;
  font-weight: 700;
  font-family: monospace;
  color: #a5b4fc;
  background: rgba(99, 102, 241, 0.1);
  padding: 2px 8px;
  border-radius: 4px;
  min-width: 44px;
  text-align: center;
}

.schedule-item .job { font-size: 13px; color: var(--text-secondary); }

.scheduler-actions { display: flex; gap: 10px; flex-wrap: wrap; }

/* WhatsApp */
.wa-content { min-height: 100px; }

.wa-disconnected p { font-size: 13px; color: var(--text-muted); margin-bottom: 16px; }

.wa-qr { text-align: center; }
.wa-qr p { font-size: 13px; color: var(--text-secondary); margin-bottom: 16px; }

.qr-wrapper {
  display: inline-block;
  padding: 16px;
  background: white;
  border-radius: 16px;
  margin-bottom: 16px;
}

.qr-wrapper img { width: 240px; height: 240px; }

.qr-hint { font-size: 11px; color: var(--text-muted); }

.wa-connected-badge {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  background: rgba(34, 197, 94, 0.08);
  border: 1px solid rgba(34, 197, 94, 0.2);
  border-radius: 12px;
  color: #22c55e;
  font-weight: 700;
  font-size: 14px;
  margin-bottom: 20px;
}

.wa-test-form h4 { font-size: 13px; font-weight: 700; color: var(--text-secondary); margin-bottom: 10px; }

.test-row { display: flex; gap: 10px; }
.test-row input {
  flex: 1;
  padding: 8px 12px;
  background: var(--bg-input);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 13px;
}

.test-result {
  margin-top: 10px;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 12px;
  background: rgba(239, 68, 68, 0.08);
  color: #ef4444;
}

.test-result.success { background: rgba(34, 197, 94, 0.08); color: #22c55e; }

.wa-loading {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  color: var(--text-muted);
}
</style>
