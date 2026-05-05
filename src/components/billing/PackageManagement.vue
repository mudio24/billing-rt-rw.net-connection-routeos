<template>
  <div class="package-management">
    <div class="panel-header">
      <div class="header-left">
        <h2>Kelola Paket Internet</h2>
        <p>Definisikan paket internet, harga, dan profil MikroTik.</p>
      </div>
      <div class="header-right" style="display: flex; gap: 10px;">
        <button class="btn btn-secondary" @click="showSyncModal = true" :disabled="syncing">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          {{ syncing ? 'Mensinkronkan...' : 'Sinkronisasi MikroTik' }}
        </button>
        <button class="btn btn-primary" @click="openForm()">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Tambah Paket
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <span class="spinner"></span> Memuat paket...
    </div>

    <div v-else-if="packages.length === 0" class="empty-state">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.3"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
      <p>Belum ada paket internet.</p>
      <button class="btn btn-sm btn-primary" @click="openForm()">Buat Paket Pertama</button>
    </div>

    <div v-else class="package-grid">
      <div v-for="pkg in packages" :key="pkg.id" class="package-card" :class="{ inactive: !pkg.is_active }">
        <div class="card-status" :class="{ active: pkg.is_active }">
          {{ pkg.is_active ? 'Aktif' : 'Non-aktif' }}
        </div>
        <div class="card-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>
        </div>
        <div class="card-content">
          <h3>{{ pkg.name }}</h3>
          <div class="speed-info">
            <div class="speed-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"></polyline></svg>
              <span>{{ pkg.speed_up }} Up</span>
            </div>
            <div class="speed-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
              <span>{{ pkg.speed_down }} Down</span>
            </div>
          </div>
          <div class="profile-badge">Profile: {{ pkg.pppoe_profile }}</div>
          <div class="price-tag">{{ formatPrice(pkg.price) }}<span>/bulan</span></div>
        </div>
        <div class="card-actions">
          <button class="btn-icon" @click="openForm(pkg)" title="Edit">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          </button>
          <button class="btn-icon delete" @click="deletePackage(pkg.id)" title="Hapus">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Package Form Modal -->
    <div v-if="showForm" class="modal-overlay" @click.self="closeForm()">
      <div class="modal-content">
        <div class="modal-header">
          <h2 class="modal-title">{{ editingPackage ? '✏️ Edit Paket' : '➕ Tambah Paket Baru' }}</h2>
          <button class="modal-close" @click="closeForm()">✕</button>
        </div>
        <form @submit.prevent="savePackage">
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Nama Paket <span class="required">*</span></label>
              <input v-model="form.name" type="text" class="form-input" placeholder="Contoh: PAKET HEMAT 5MB" required>
            </div>
            <div class="form-group">
              <label class="form-label">MikroTik PPPoE Profile <span class="required">*</span></label>
              <input v-model="form.pppoe_profile" type="text" class="form-input" placeholder="Harus sama dengan nama profile di MikroTik" required>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Upload Speed <span class="required">*</span></label>
                <input v-model="form.speed_up" type="text" class="form-input" placeholder="Contoh: 5M" required>
              </div>
              <div class="form-group">
                <label class="form-label">Download Speed <span class="required">*</span></label>
                <input v-model="form.speed_down" type="text" class="form-input" placeholder="Contoh: 5M" required>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Harga per Bulan (Rp) <span class="required">*</span></label>
              <input v-model.number="form.price" type="number" class="form-input" placeholder="Contoh: 150000" required>
            </div>
            <div class="form-group">
              <label class="form-label">Deskripsi (Opsional)</label>
              <textarea v-model="form.description" class="form-input" rows="2" placeholder="Keterangan paket..."></textarea>
            </div>
            <div class="form-group" style="display: flex; align-items: center; gap: 8px;">
              <input type="checkbox" id="package-active" v-model="form.is_active" style="width: 18px; height: 18px; accent-color: var(--accent-blue);">
              <label for="package-active" style="font-size: 14px; color: var(--text-primary); cursor: pointer; user-select: none;">Paket Aktif</label>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeForm()">Batal</button>
            <button type="submit" class="btn btn-primary" :disabled="submitting">
              <span v-if="submitting" class="spinner"></span>
              {{ submitting ? 'Menyimpan...' : 'Simpan Paket' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Sync Modal -->
    <div v-if="showSyncModal" class="modal-overlay">
      <div class="modal-content" style="max-width: 400px;">
        <div class="modal-header">
          <h3>Sinkronisasi Paket dari MikroTik</h3>
          <button class="close-btn" @click="showSyncModal = false">&times;</button>
        </div>
        <div class="modal-body">
          <p style="margin-bottom: 15px; font-size: 14px; color: var(--text-muted);">
            Sistem akan mengambil semua PPPoE Profiles dari router dan menjadikannya Paket Internet (Harga default Rp 0).
          </p>
          <div class="form-group">
            <label>Pilih Router</label>
            <select v-model="selectedRouterForSync" class="form-input">
              <option value="">-- Pilih Router --</option>
              <option v-for="r in mikrotiks" :key="r.id" :value="r.id">
                {{ r.name }} ({{ r.ip_address }})
              </option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showSyncModal = false">Batal</button>
          <button class="btn btn-primary" @click="handleSync" :disabled="!selectedRouterForSync || syncing">
            <span v-if="syncing" class="spinner"></span>
            {{ syncing ? 'Proses...' : 'Mulai Sinkronisasi' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { apiService } from '@/services/api';

export default {
  name: 'PackageManagement',
  props: {
    mikrotiks: { type: Array, default: () => [] }
  },
  data() {
    return {
      packages: [],
      loading: true,
      showForm: false,
      submitting: false,
      editingPackage: null,
      showSyncModal: false,
      selectedRouterForSync: '',
      syncing: false,
      form: {
        name: '',
        pppoe_profile: '',
        speed_up: '',
        speed_down: '',
        price: '',
        description: '',
        is_active: true
      }
    };
  },
  mounted() {
    this.loadPackages();
  },
  methods: {
    async loadPackages() {
      this.loading = true;
      try {
        const res = await apiService.getPackages();
        if (res.success) {
          this.packages = res.data;
        }
      } catch (err) {
        console.error('Failed to load packages:', err);
      } finally {
        this.loading = false;
      }
    },
    formatPrice(price) {
      return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);
    },
    openForm(pkg = null) {
      if (pkg) {
        this.editingPackage = pkg;
        this.form = { ...pkg };
      } else {
        this.editingPackage = null;
        this.form = {
          name: '',
          pppoe_profile: '',
          speed_up: '',
          speed_down: '',
          price: '',
          description: '',
          is_active: true
        };
      }
      this.showForm = true;
    },
    closeForm() {
      this.showForm = false;
    },
    async savePackage() {
      this.submitting = true;
      try {
        let res;
        if (this.editingPackage) {
          res = await apiService.updatePackage(this.editingPackage.id, this.form);
        } else {
          res = await apiService.addPackage(this.form);
        }

        if (res.success) {
          this.closeForm();
          this.loadPackages();
        } else {
          alert('Gagal menyimpan: ' + res.error);
        }
      } catch (err) {
        alert('Terjadi kesalahan sistem.');
      } finally {
        this.submitting = false;
      }
    },
    async handleSync() {
      if (!this.selectedRouterForSync) return;
      
      this.syncing = true;
      try {
        const res = await apiService.syncPackagesFromMikrotik(this.selectedRouterForSync);
        if (res.success) {
          alert(res.message);
          this.showSyncModal = false;
          this.loadPackages();
        } else {
          alert(res.error || 'Gagal sinkronisasi');
        }
      } catch (err) {
        const errMsg = err.response?.data?.error || err.message;
        alert('Error: ' + errMsg);
      } finally {
        this.syncing = false;
      }
    },
    async deletePackage(id) {
      if (!confirm('Apakah Anda yakin ingin menghapus paket ini?')) return;
      try {
        const res = await apiService.deletePackage(id);
        if (res.success) {
          this.loadPackages();
        } else {
          alert(res.error);
        }
      } catch (err) {
        alert('Gagal menghapus paket.');
      }
    }
  }
};
</script>

<style scoped>
.package-management {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left h2 {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.header-left p {
  font-size: 13px;
  color: var(--text-muted);
}

.package-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.package-card {
  background: var(--bg-card);
  border: 1px solid var(--border-card);
  border-radius: var(--radius-lg);
  padding: 24px;
  position: relative;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 20px rgba(0,0,0,0.05);
}

.package-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 30px rgba(0,0,0,0.12);
  border-color: var(--accent-blue);
}

.package-card.inactive {
  opacity: 0.7;
  filter: grayscale(0.5);
}

.card-status {
  position: absolute;
  top: 16px;
  right: 16px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  padding: 4px 8px;
  border-radius: 20px;
  background: #f1f5f9;
  color: #64748b;
}

.card-status.active {
  background: rgba(34, 197, 94, 0.1);
  color: #22c55e;
}

.card-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: rgba(91, 76, 245, 0.1);
  color: var(--accent-blue);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.card-content h3 {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 12px;
}

.speed-info {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.speed-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  background: var(--bg-glass);
  padding: 4px 8px;
  border-radius: 6px;
}

.profile-badge {
  font-size: 11px;
  color: var(--text-muted);
  margin-bottom: 16px;
}

.price-tag {
  font-size: 22px;
  font-weight: 800;
  color: var(--accent-blue);
  margin-top: auto;
}

.price-tag span {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-muted);
}

.card-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--border-subtle);
}

.btn-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-glass);
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.btn-icon:hover {
  background: var(--bg-card);
  color: var(--accent-blue);
  border-color: var(--accent-blue);
}

.btn-icon.delete:hover {
  color: #ef4444;
  border-color: #ef4444;
}

/* Modal */
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

@media (max-width: 600px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}

.form-group.checkbox {
  grid-column: span 2;
  flex-direction: row;
  align-items: center;
  gap: 8px;
}

.form-group.checkbox input {
  width: auto;
}
</style>
