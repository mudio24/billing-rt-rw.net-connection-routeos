<template>
  <div class="system-panel">
    <div class="panel-header">
      <div class="header-left">
        <h2>Job Scheduler Otomatis</h2>
        <p>Kelola jadwal otomatisasi sistem billing dan notifikasi.</p>
      </div>
    </div>

    <div class="settings-grid">
      <!-- Scheduler Card -->
      <div class="card card-full">
        <div class="card-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <span>Jadwal Harian Sistem</span>
        </div>
        <div class="scheduler-info">
          <p class="desc">Job scheduler berjalan otomatis setiap hari sesuai jadwal berikut (WIB):</p>
          <div class="schedule-list">
            <div class="schedule-item">
              <input type="time" v-model="schedules.schedule_generate_invoice" class="time-input">
              <span class="job">Auto-generate invoice untuk pelanggan yang jatuh tempo hari ini</span>
            </div>
            <div class="schedule-item">
              <input type="time" v-model="schedules.schedule_check_overdue" class="time-input">
              <span class="job">Cek dan rekap status invoice jatuh tempo</span>
            </div>
            <div class="schedule-item">
              <input type="time" v-model="schedules.schedule_auto_suspend" class="time-input">
              <span class="job">Auto-isolir pelanggan yang telah melewati batas grace period</span>
            </div>
            <div class="schedule-item">
              <input type="time" v-model="schedules.schedule_send_reminders" class="time-input">
              <span class="job">Kirim pesan WhatsApp otomatis (Tagihan, Pengingat, Bukti Pembayaran)</span>
            </div>
          </div>
          <button class="btn-wa-green" style="width:100%; display:flex; justify-content:center; align-items:center; gap:8px;" @click="saveSchedules" :disabled="isSaving">
            <span v-if="isSaving" class="loading-spinner"></span>
            <svg v-if="!isSaving" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
            {{ isSaving ? 'Menyimpan & Me-restart Jadwal...' : 'Simpan Jadwal' }}
          </button>
        </div>
        <div class="scheduler-actions">
          <button class="btn btn-secondary" @click="runInvoices" :disabled="runningJob === 'invoices'">
            <span v-if="runningJob === 'invoices'" class="loading-spinner"></span>
            {{ runningJob === 'invoices' ? 'Memproses...' : '▶ Picu Auto-Generate Invoice' }}
          </button>
          <button class="btn btn-danger" @click="runSuspend" :disabled="runningJob === 'suspend'" style="display:flex; align-items:center; justify-content:center; gap:8px;">
            <span v-if="runningJob === 'suspend'" class="loading-spinner"></span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            {{ runningJob === 'suspend' ? 'Memproses...' : '▶ Picu Auto-Isolir Sekarang' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { apiService } from '@/services/api';

export default {
  name: 'JobScheduler',
  data() {
    return {
      runningJob: null,
      isSaving: false,
      schedules: {
        schedule_generate_invoice: '00:05',
        schedule_check_overdue: '08:00',
        schedule_auto_suspend: '09:00',
        schedule_send_reminders: '10:00'
      }
    };
  },
  async mounted() {
    await this.loadSettings();
  },
  methods: {
    async loadSettings() {
      try {
        const res = await apiService.getSettings();
        if (res.success && res.data) {
          if (res.data.schedule_generate_invoice) this.schedules.schedule_generate_invoice = res.data.schedule_generate_invoice;
          if (res.data.schedule_check_overdue) this.schedules.schedule_check_overdue = res.data.schedule_check_overdue;
          if (res.data.schedule_auto_suspend) this.schedules.schedule_auto_suspend = res.data.schedule_auto_suspend;
          if (res.data.schedule_send_reminders) this.schedules.schedule_send_reminders = res.data.schedule_send_reminders;
        }
      } catch (err) {
        console.error('Failed to load schedules:', err);
      }
    },
    async saveSchedules() {
      this.isSaving = true;
      try {
        const keys = Object.keys(this.schedules);
        const promises = keys.map(key => apiService.updateSetting(key, this.schedules[key]));
        await Promise.all(promises);
        
        // Reload scheduler on backend
        const token = localStorage.getItem('token');
        const res = await fetch('/api/scheduler/reload', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await res.json();
        
        if (result.success) {
          alert('Jadwal berhasil disimpan dan scheduler sudah direstart!');
        } else {
          alert('Berhasil menyimpan, tapi gagal restart scheduler: ' + result.error);
        }
      } catch (err) {
        alert('Gagal menyimpan jadwal: ' + err.message);
      } finally {
        this.isSaving = false;
      }
    },
    async runInvoices() {
      if (!confirm('Picu auto-generate invoice sekarang?')) return;
      this.runningJob = 'invoices';
      try {
        const res = await apiService.runInvoiceGeneration();
        alert(res.message || 'Proses pembuatan invoice selesai!');
      } catch (err) {
        alert('Gagal: ' + err.message);
      } finally {
        this.runningJob = null;
      }
    },
    async runSuspend() {
      if (!confirm('Picu auto-isolir sekarang? Pelanggan yang menunggak akan diblokir.')) return;
      this.runningJob = 'suspend';
      try {
        const res = await apiService.runAutoSuspend();
        alert(res.message || 'Proses auto-isolir selesai!');
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
  grid-template-columns: 1fr;
  gap: 20px;
}

.card {
  background: var(--bg-card);
  border: 1px solid var(--border-card);
  border-radius: 20px;
  padding: 24px;
}

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

.scheduler-info .desc { font-size: 13px; color: var(--text-muted); margin-bottom: 16px; }

.schedule-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 24px; }

.schedule-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--bg-glass);
  border-radius: 8px;
}

.schedule-item .time-input {
  font-size: 14px;
  font-weight: 700;
  font-family: monospace;
  color: #a5b4fc;
  background: var(--bg-input);
  border: 1px solid var(--border-subtle);
  padding: 6px 12px;
  border-radius: 6px;
  width: 120px;
  text-align: center;
}

.schedule-item .time-input:focus {
  border-color: var(--accent-blue);
  outline: none;
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

.schedule-item .job { font-size: 13px; color: var(--text-secondary); font-weight: 500; }

.scheduler-actions { 
  display: flex; 
  gap: 16px; 
  flex-wrap: wrap; 
  margin-top: 10px;
  padding-top: 20px;
  border-top: 1px solid var(--border-subtle);
}
.scheduler-actions button {
  flex: 1;
}

.loading-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  display: inline-block;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
