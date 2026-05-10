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
    <div class="package-data-card">
      <div class="table-toolbar">
        <div class="toolbar-left">
          <div class="search-box">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input v-model="searchQuery" type="text" placeholder="Cari paket atau profile...">
          </div>
          <select v-model="sortBy" class="sort-select">
            <option value="name">Nama Paket (A-Z)</option>
            <option value="price_asc">Harga Terendah</option>
            <option value="price_desc">Harga Tertinggi</option>
          </select>
        </div>
        <div class="view-toggle">
          <button @click="viewMode = 'grid'" class="btn-icon view-mode" :class="{ 'active-view': viewMode === 'grid' }" title="Grid View">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
          </button>
          <button @click="viewMode = 'list'" class="btn-icon view-mode" :class="{ 'active-view': viewMode === 'list' }" title="List View">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
          </button>
        </div>
      </div>

      <div v-if="loading" class="loading-state">
        <span class="spinner"></span> Memuat paket...
      </div>

      <div v-else-if="filteredAndSortedPackages.length === 0" class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.3"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
        <p>Tidak ada paket yang sesuai.</p>
        <button v-if="packages.length === 0" class="btn btn-sm btn-primary" @click="openForm()">Buat Paket Pertama</button>
      </div>

      <!-- GRID VIEW -->
      <div v-else-if="viewMode === 'grid'" class="package-grid">
      <div v-for="pkg in filteredAndSortedPackages" :key="pkg.id" class="package-card" :class="{ inactive: !pkg.is_active }">
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
        <div class="card-activation">
          <span>Status Paket</span>
          <label class="mini-toggle" :for="`package-active-grid-${pkg.id}`" :title="pkg.is_active ? 'Nonaktifkan paket' : 'Aktifkan paket'">
            <input
              type="checkbox"
              :id="`package-active-grid-${pkg.id}`"
              :checked="pkg.is_active"
              :disabled="togglingPackageId === pkg.id"
              @change="togglePackageActive(pkg)"
            >
            <span class="mini-toggle-track" aria-hidden="true">
              <span class="mini-toggle-thumb"></span>
            </span>
          </label>
        </div>
        <div class="card-actions">
          <button class="btn-icon view" @click="openDetail(pkg)" title="Lihat Detail">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"></path><circle cx="12" cy="12" r="3"></circle></svg>
          </button>
          <button class="btn-icon" @click="openForm(pkg)" title="Edit">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          </button>
          <button class="btn-icon delete" @click="deletePackage(pkg.id)" title="Hapus">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </div>
      </div>
    </div>

    <!-- LIST VIEW -->
      <div v-else class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Nama Paket</th>
            <th>Profile PPPoE</th>
            <th>Speed (Up/Down)</th>
            <th>Harga</th>
            <th>Status</th>
            <th class="actions">Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="pkg in filteredAndSortedPackages" :key="pkg.id" :class="{ 'text-muted': !pkg.is_active }">
            <td><strong>{{ pkg.name }}</strong></td>
            <td><span class="badge" style="background:var(--bg-dark); color:var(--text-muted); border:1px solid var(--border-light);">{{ pkg.pppoe_profile }}</span></td>
            <td>{{ pkg.speed_up }} / {{ pkg.speed_down }}</td>
            <td style="font-weight: 600; color: #10b981;">{{ formatPrice(pkg.price) }}</td>
            <td>
              <div class="table-status-toggle">
                <label class="mini-toggle" :for="`package-active-table-${pkg.id}`" :title="pkg.is_active ? 'Nonaktifkan paket' : 'Aktifkan paket'">
                  <input
                    type="checkbox"
                    :id="`package-active-table-${pkg.id}`"
                    :checked="pkg.is_active"
                    :disabled="togglingPackageId === pkg.id"
                    @change="togglePackageActive(pkg)"
                  >
                  <span class="mini-toggle-track" aria-hidden="true">
                    <span class="mini-toggle-thumb"></span>
                  </span>
                </label>
                <span :class="pkg.is_active ? 'status-active' : 'status-inactive'" style="padding: 4px 8px; border-radius: 20px; font-size: 11px; font-weight: 600;">
                  {{ pkg.is_active ? 'Aktif' : 'Non-aktif' }}
                </span>
              </div>
            </td>
            <td class="actions">
              <div class="btn-group">
                <button class="btn-icon view" @click="openDetail(pkg)" title="Lihat Detail">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                </button>
                <button class="btn-icon edit" @click="openForm(pkg)" title="Edit">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                </button>
                <button class="btn-icon delete" @click="deletePackage(pkg.id)" title="Hapus">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
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
            <div class="form-group">
              <label class="toggle-control" for="package-active">
                <input type="checkbox" id="package-active" v-model="form.is_active">
                <span class="toggle-track" aria-hidden="true">
                  <span class="toggle-thumb"></span>
                </span>
                <span class="toggle-text">Paket Aktif</span>
              </label>
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

    <!-- Package Detail Modal -->
    <div v-if="selectedPackage" class="modal-overlay" @click.self="closeDetail()">
      <div class="modal-content detail-modal">
        <div class="modal-header">
          <h2 class="modal-title">Detail Paket</h2>
          <button class="modal-close" @click="closeDetail()">Tutup</button>
        </div>
        <div class="modal-body">
          <div class="detail-header">
            <div>
              <p class="detail-label">Nama Paket</p>
              <h3>{{ selectedPackage.name }}</h3>
            </div>
            <span :class="selectedPackage.is_active ? 'status-active' : 'status-inactive'" class="detail-status">
              {{ selectedPackage.is_active ? 'Aktif' : 'Non-aktif' }}
            </span>
          </div>

          <div class="detail-grid">
            <div class="detail-item">
              <span>Profile PPPoE</span>
              <strong>{{ selectedPackage.pppoe_profile || '-' }}</strong>
            </div>
            <div class="detail-item">
              <span>Upload Speed</span>
              <strong>{{ selectedPackage.speed_up || '-' }}</strong>
            </div>
            <div class="detail-item">
              <span>Download Speed</span>
              <strong>{{ selectedPackage.speed_down || '-' }}</strong>
            </div>
            <div class="detail-item">
              <span>Harga Bulanan</span>
              <strong>{{ formatPrice(selectedPackage.price || 0) }}</strong>
            </div>
          </div>

          <div class="detail-description">
            <span>Deskripsi</span>
            <p>{{ selectedPackage.description || 'Tidak ada deskripsi.' }}</p>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="closeDetail()">Tutup</button>
          <button type="button" class="btn btn-primary" @click="openForm(selectedPackage)">Edit Paket</button>
        </div>
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
      selectedPackage: null,
      togglingPackageId: null,
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
      },
      searchQuery: '',
      sortBy: 'name',
      viewMode: 'grid'
    };
  },
  computed: {
    filteredAndSortedPackages() {
      let result = this.packages;
      
      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase();
        result = result.filter(p => 
          p.name.toLowerCase().includes(q) || 
          p.pppoe_profile.toLowerCase().includes(q)
        );
      }
      
      result = [...result].sort((a, b) => {
        if (this.sortBy === 'name') return a.name.localeCompare(b.name);
        if (this.sortBy === 'price_asc') return a.price - b.price;
        if (this.sortBy === 'price_desc') return b.price - a.price;
        return 0;
      });
      
      return result;
    }
  },
  mounted() {
    this.loadPackages();
  },
  methods: {
    normalizePackage(pkg) {
      return {
        ...pkg,
        is_active: pkg.is_active === 1 || pkg.is_active === true || pkg.is_active === '1'
      };
    },
    packagePayload(pkg, overrides = {}) {
      return {
        name: pkg.name,
        pppoe_profile: pkg.pppoe_profile,
        speed_up: pkg.speed_up,
        speed_down: pkg.speed_down,
        price: pkg.price,
        description: pkg.description || '',
        is_active: pkg.is_active,
        ...overrides
      };
    },
    async loadPackages() {
      this.loading = true;
      try {
        const res = await apiService.getPackages();
        if (res.success) {
          this.packages = res.data.map(this.normalizePackage);
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
        this.form = this.normalizePackage(pkg);
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
      this.selectedPackage = null;
      this.showForm = true;
    },
    closeForm() {
      this.showForm = false;
    },
    async openDetail(pkg) {
      this.selectedPackage = this.normalizePackage(pkg);
      try {
        const res = await apiService.getPackage(pkg.id);
        if (res.success) {
          this.selectedPackage = this.normalizePackage(res.data);
        }
      } catch (err) {
        alert('Gagal membaca detail paket terbaru.');
      }
    },
    closeDetail() {
      this.selectedPackage = null;
    },
    async togglePackageActive(pkg) {
      if (this.togglingPackageId) return;

      const previousValue = pkg.is_active;
      const nextValue = !previousValue;
      pkg.is_active = nextValue;
      if (this.selectedPackage?.id === pkg.id) {
        this.selectedPackage = this.normalizePackage(pkg);
      }
      this.togglingPackageId = pkg.id;

      try {
        const res = await apiService.updatePackage(pkg.id, this.packagePayload(pkg, { is_active: nextValue }));
        if (!res.success) {
          pkg.is_active = previousValue;
          if (this.selectedPackage?.id === pkg.id) {
            this.selectedPackage = this.normalizePackage(pkg);
          }
          alert('Gagal mengubah status paket: ' + (res.error || 'Terjadi kesalahan.'));
        }
      } catch (err) {
        pkg.is_active = previousValue;
        if (this.selectedPackage?.id === pkg.id) {
          this.selectedPackage = this.normalizePackage(pkg);
        }
        alert('Gagal mengubah status paket.');
      } finally {
        this.togglingPackageId = null;
      }
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
  padding: 20px 24px 24px;
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
  width: 34px;
  height: 34px;
  padding: 0;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-glass);
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.btn-icon svg {
  width: 16px;
  height: 16px;
  stroke: currentColor;
}

.btn-icon:hover {
  background: var(--bg-card);
  color: var(--accent-blue);
  border-color: var(--accent-blue);
}

.btn-icon.delete {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.2);
}

.btn-icon.delete:hover {
  background: rgba(239, 68, 68, 0.16);
  color: #ef4444;
  border-color: #ef4444;
}

.btn-icon.view {
  color: #14b8a6;
  background: rgba(20, 184, 166, 0.1);
  border-color: rgba(20, 184, 166, 0.2);
}

.btn-icon.view:hover {
  background: rgba(20, 184, 166, 0.16);
  color: #14b8a6;
  border-color: #14b8a6;
}

.btn-icon.edit {
  color: #3b82f6;
  background: rgba(59, 130, 246, 0.1);
  border-color: rgba(59, 130, 246, 0.2);
}

.card-activation {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid var(--border-subtle);
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
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

.toggle-control {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  width: fit-content;
  cursor: pointer;
  user-select: none;
}

.toggle-control input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.toggle-track {
  width: 46px;
  height: 26px;
  padding: 3px;
  border-radius: 999px;
  background: var(--bg-dark);
  border: 1px solid var(--border-light);
  transition: background 0.2s ease, border-color 0.2s ease;
}

.toggle-thumb {
  display: block;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--text-muted);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
  transition: transform 0.2s ease, background 0.2s ease;
}

.toggle-text {
  font-size: 14px;
  color: var(--text-primary);
}

.toggle-control input:checked + .toggle-track {
  background: rgba(59, 130, 246, 0.2);
  border-color: var(--accent-blue);
}

.toggle-control input:checked + .toggle-track .toggle-thumb {
  transform: translateX(20px);
  background: var(--accent-blue);
}

.toggle-control input:focus-visible + .toggle-track {
  outline: 2px solid var(--accent-blue);
  outline-offset: 2px;
}

.mini-toggle {
  display: inline-flex;
  align-items: center;
  cursor: pointer;
}

.mini-toggle input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.mini-toggle-track {
  width: 38px;
  height: 22px;
  padding: 2px;
  border-radius: 999px;
  background: rgba(100, 116, 139, 0.22);
  border: 1px solid var(--border-light);
  transition: background 0.2s ease, border-color 0.2s ease, opacity 0.2s ease;
}

.mini-toggle-thumb {
  display: block;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #94a3b8;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.25);
  transition: transform 0.2s ease, background 0.2s ease;
}

.mini-toggle input:checked + .mini-toggle-track {
  background: rgba(16, 185, 129, 0.18);
  border-color: rgba(16, 185, 129, 0.5);
}

.mini-toggle input:checked + .mini-toggle-track .mini-toggle-thumb {
  transform: translateX(16px);
  background: #10b981;
}

.mini-toggle input:disabled + .mini-toggle-track {
  cursor: wait;
  opacity: 0.65;
}

.mini-toggle input:focus-visible + .mini-toggle-track {
  outline: 2px solid var(--accent-blue);
  outline-offset: 2px;
}

.table-status-toggle {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.detail-modal {
  max-width: 560px;
}

.detail-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.detail-header h3 {
  margin: 4px 0 0;
  font-size: 20px;
  color: var(--text-primary);
}

.detail-label {
  margin: 0;
  font-size: 12px;
  color: var(--text-muted);
}

.detail-status {
  flex-shrink: 0;
  padding: 5px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.detail-item {
  padding: 12px;
  border: 1px solid var(--border-light);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.02);
}

.detail-item span,
.detail-description span {
  display: block;
  margin-bottom: 6px;
  font-size: 11px;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
}

.detail-item strong {
  font-size: 14px;
  color: var(--text-primary);
}

.detail-description {
  margin-top: 12px;
  padding: 12px;
  border: 1px solid var(--border-light);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.02);
}

.detail-description p {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  color: var(--text-secondary);
}

.package-data-card {
  background: var(--bg-card);
  border: 1px solid var(--border-card);
  border-radius: var(--radius-lg);
  box-shadow: 0 4px 20px rgba(0,0,0,0.05);
  overflow: hidden;
}

.table-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  padding: 16px 24px;
  border-bottom: 1px solid var(--border-subtle);
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 280px;
}

.search-box {
  position: relative;
  flex: 1;
  max-width: 400px;
}

.search-box svg {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
}

.search-box input {
  width: 100%;
  padding: 10px 12px 10px 40px;
  background: var(--bg-input);
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  font-size: 14px;
  color: var(--text-primary);
  transition: all 0.2s;
}

.search-box input:focus {
  border-color: var(--accent-blue);
  box-shadow: 0 0 0 4px rgba(91, 76, 245, 0.1);
  outline: none;
}

.sort-select {
  min-width: 180px;
  padding: 10px 12px;
  background: var(--bg-input);
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  color: var(--text-primary);
  font-size: 14px;
  cursor: pointer;
}

.sort-select:focus {
  border-color: var(--accent-blue);
  box-shadow: 0 0 0 4px rgba(91, 76, 245, 0.1);
  outline: none;
}

.view-toggle {
  display: flex;
  gap: 5px;
  padding: 4px;
  background: var(--bg-dark);
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
}

.btn-icon.view-mode {
  width: 32px;
  height: 32px;
  color: var(--text-muted);
  background: transparent;
}

.btn-icon.view-mode:hover {
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.05);
}

.view-toggle .active-view {
  color: var(--accent-blue);
  background: rgba(59, 130, 246, 0.14);
  border-color: rgba(59, 130, 246, 0.35);
}

.table-container {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.data-table th, .data-table td {
  padding: 16px 24px;
  text-align: left;
  border-bottom: 1px solid var(--border-subtle);
  font-size: 13px;
  vertical-align: middle;
}

.data-table th {
  padding: 14px 24px;
  background: rgba(248, 250, 252, 0.05);
  color: var(--text-muted);
  font-weight: 600;
  text-transform: uppercase;
  font-size: 12px;
}

.data-table tr:hover {
  background: rgba(255, 255, 255, 0.02);
}

.data-table tr:last-child td {
  border-bottom: none;
}

.btn-group {
  display: flex;
  gap: 8px;
}

.actions {
  width: 132px;
}

.status-active {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.status-inactive {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.text-muted {
  opacity: 0.6;
}
</style>
