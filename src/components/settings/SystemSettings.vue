<template>
  <div class="system-panel">
    <div class="panel-header">
      <div class="header-left">
        <h2>Pengaturan Sistem</h2>
        <p>Kelola konfigurasi billing dan scheduler otomatis.</p>
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
            <input v-model="settings.company_name" type="text" placeholder="DIONIT CELL">
          </div>
          <div class="setting-row">
            <div class="setting-info">
              <label>No. WA Admin</label>
              <span>Nomor yang bisa dihubungi pelanggan</span>
            </div>
            <input v-model="settings.company_phone" type="text" placeholder="628xxx">
          </div>
          <div class="setting-row">
            <div class="setting-info">
              <label>Jarak Terbit Invoice (Hari)</label>
              <span>Muncul H-X hari sebelum tanggal langganan</span>
            </div>
            <input v-model="settings.invoice_lead_days" type="number" min="0" max="30">
          </div>
          <div class="setting-row">
            <div class="setting-info">
              <label>Jarak Jatuh Tempo (Hari)</label>
              <span>Batas bayar (0 = Pas tanggal langganan)</span>
            </div>
            <input v-model="settings.billing_due_days" type="number" min="0" max="30">
          </div>
          <div class="setting-row">
            <div class="setting-info">
              <label>Grace Period (Hari)</label>
              <span>Toleransi setelah jatuh tempo sebelum isolir</span>
            </div>
            <input v-model="settings.billing_grace_days" type="number" min="0" max="30">
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
        <button class="btn-wa-green" style="margin-top:20px; width:100%; display:flex; justify-content:center; align-items:center; gap:8px;" @click="saveAllSettings" :disabled="isSaving">
          <span v-if="isSaving" class="loading-spinner"></span>
          <svg v-if="!isSaving" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
          {{ isSaving ? 'Menyimpan...' : 'Simpan Pengaturan' }}
        </button>
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
        invoice_lead_days: '7',
        billing_due_days: '0',
        billing_grace_days: '3',
        auto_suspend: 'true',
        invoice_prefix: 'INV'
      },
      runningJob: null,
      isSaving: false
    };
  },
  async mounted() {
    await this.loadSettings();
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
    },
    async saveAllSettings() {
      this.isSaving = true;
      try {
        const keys = Object.keys(this.settings);
        
        // Use sequential saving to avoid database locks (Error 500)
        for (const key of keys) {
          await apiService.updateSetting(key, this.settings[key]);
        }
        
        // Dispatch event so other components (like Sidebar in App.vue) can update
        window.dispatchEvent(new CustomEvent('settings-updated'));
        
        alert('Semua pengaturan berhasil disimpan!');
      } catch (err) {
        console.error('Save error:', err);
        alert('Gagal menyimpan pengaturan: ' + (err.response?.data?.error || err.message));
      } finally {
        this.isSaving = false;
      }
    },

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

.btn-wa-green {
  background: #10b981;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-wa-green:hover { background: #059669; }
.btn-wa-green:disabled { opacity: 0.7; cursor: not-allowed; }

.loading-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
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
