<template>
  <div class="customer-management">
    <div class="panel-header">
      <div class="header-left">
        <h2>Data Pelanggan</h2>
        <p>Kelola data pelanggan, paket, dan status isolir MikroTik.</p>
      </div>
      <div class="header-right" style="display: flex; gap: 10px;">
        <button class="btn btn-secondary" @click="showSyncModal = true" :disabled="syncing">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          {{ syncing ? 'Mensinkronkan...' : 'Sinkronisasi MikroTik' }}
        </button>
        <button class="btn btn-primary" @click="openForm()">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
          Tambah Pelanggan
        </button>
      </div>
    </div>

    <!-- Stats Bar -->
    <div class="stats-bar">
      <div class="stat-item">
        <span class="stat-label">Total</span>
        <span class="stat-value">{{ customers.length }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label active">Aktif</span>
        <span class="stat-value">{{ customers.filter(c => c.status === 'active').length }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label suspended">Isolir</span>
        <span class="stat-value">{{ customers.filter(c => c.status === 'suspended').length }}</span>
      </div>
    </div>

    <div class="table-card">
      <div class="table-toolbar">
        <div class="toolbar-left">
          <div class="search-box">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input v-model="searchQuery" type="text" placeholder="Cari pelanggan (nama/HP/PPPoE)...">
          </div>
          <select v-model="sortBy" class="sort-select">
            <option value="name_asc">Nama A-Z</option>
            <option value="name_desc">Nama Z-A</option>
            <option value="package_asc">Paket A-Z</option>
            <option value="price_asc">Harga Terendah</option>
            <option value="price_desc">Harga Tertinggi</option>
            <option value="billing_date_asc">Tagihan Terdekat</option>
            <option value="status_asc">Status</option>
          </select>
        </div>
        <div class="view-toggle">
          <button type="button" class="btn-icon view-mode" :class="{ active: viewMode === 'grid' }" @click="viewMode = 'grid'" title="Tampilan Grid">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
          </button>
          <button type="button" class="btn-icon view-mode" :class="{ active: viewMode === 'table' }" @click="viewMode = 'table'" title="Tampilan Tabel">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
          </button>
        </div>
      </div>

      <div v-if="loading" class="loading-state">
        <span class="spinner"></span> Memuat data pelanggan...
      </div>

      <div v-else-if="viewMode === 'table'" class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Pelanggan</th>
              <th>Paket</th>
              <th>MikroTik Info</th>
              <th>Tgl Tagihan</th>
              <th>Status</th>
              <th class="actions">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in filteredAndSortedCustomers" :key="c.id">
              <td>
                <div class="customer-info">
                  <div class="name">{{ c.name }}</div>
                  <div class="phone">{{ c.phone }}</div>
                </div>
              </td>
              <td>
                <div class="package-info">
                  <div class="pkg-name">{{ c.package_name }}</div>
                  <div class="pkg-price">{{ formatPrice(c.package_price) }}</div>
                </div>
              </td>
              <td>
                <div class="pppoe-info">
                  <span class="badge badge-outline">{{ c.pppoe_username }}</span>
                  <div class="router">MikroTik ID: {{ c.router_id }}</div>
                </div>
              </td>
              <td>Tgl {{ c.billing_date }}</td>
              <td>
                <span class="status-badge" :class="c.status">
                  {{ c.status === 'active' ? 'AKTIF' : 'ISOLIR' }}
                </span>
              </td>
              <td class="actions">
                <div class="btn-group">
                  <button v-if="c.status === 'active'" class="btn-icon warning" @click="suspendCustomer(c)" title="Isolir">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>
                  </button>
                  <button v-else class="btn-icon success" @click="activateCustomer(c)" title="Aktifkan">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </button>
                  <button class="btn-icon" @click="openForm(c)" title="Edit">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                  </button>
                  <button class="btn-icon danger" @click="deleteCustomer(c)" title="Hapus">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="filteredAndSortedCustomers.length === 0">
              <td colspan="6" class="empty-row">Tidak ada data pelanggan yang cocok.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="customer-grid">
        <div v-for="c in filteredAndSortedCustomers" :key="c.id" class="customer-card" :class="{ suspended: c.status === 'suspended' }">
          <div class="customer-card-status" :class="{ active: c.status === 'active', suspended: c.status === 'suspended' }">
            {{ c.status === 'active' ? 'Aktif' : 'Isolir' }}
          </div>
          <div class="customer-card-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
          </div>
          <div class="customer-card-content">
            <h3>{{ c.name }}</h3>
            <div class="customer-meta">
              <div class="meta-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.08 4.18 2 2 0 0 1 4.06 2h3a2 2 0 0 1 2 1.72c.13.96.35 1.89.67 2.78a2 2 0 0 1-.45 2.11L8.09 9.8a16 16 0 0 0 6.11 6.11l1.19-1.19a2 2 0 0 1 2.11-.45c.89.32 1.82.54 2.78.67A2 2 0 0 1 22 16.92z"></path></svg>
                <span>{{ c.phone || '-' }}</span>
              </div>
              <div class="meta-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                <span>Tgl {{ c.billing_date || '-' }}</span>
              </div>
            </div>
            <div class="customer-profile-badge">PPPoE: {{ c.pppoe_username || '-' }}</div>
            <div class="customer-profile-badge">Router ID: {{ c.router_id || '-' }}</div>
            <div class="customer-package-name">{{ c.package_name || '-' }}</div>
            <div class="customer-price-tag">{{ formatPrice(c.package_price || 0) }}<span>/bulan</span></div>
          </div>
          <div class="customer-card-actions">
            <button v-if="c.status === 'active'" class="btn-icon warning" @click="suspendCustomer(c)" title="Isolir">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>
            </button>
            <button v-else class="btn-icon success" @click="activateCustomer(c)" title="Aktifkan">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </button>
            <button class="btn-icon edit" @click="openForm(c)" title="Edit">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </button>
            <button class="btn-icon danger" @click="deleteCustomer(c)" title="Hapus">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </div>
        </div>
        <div v-if="filteredAndSortedCustomers.length === 0" class="empty-grid">
          Tidak ada data pelanggan yang cocok.
        </div>
      </div>
    </div>

    <!-- Customer Form Modal -->
    <div v-if="showForm" class="modal-overlay" @click.self="closeForm()">
      <div class="modal-content" style="max-width: 650px;">
        <div class="modal-header">
          <h2 class="modal-title">{{ editingCustomer ? '✏️ Edit Pelanggan' : '➕ Tambah Pelanggan Baru' }}</h2>
          <button class="modal-close" @click="closeForm()">✕</button>
        </div>
        <form @submit.prevent="saveCustomer">
          <div class="modal-body">
            <div class="form-section">
              <h4 style="margin-bottom: 12px; color: var(--text-primary); font-size: 14px;">Informasi Personal</h4>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Nama Lengkap <span class="required">*</span></label>
                  <input v-model="form.name" type="text" class="form-input" placeholder="Contoh: Budi Santoso" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Nomor WhatsApp (628xxx) <span class="required">*</span></label>
                  <input v-model="form.phone" type="text" class="form-input" placeholder="Contoh: 628123456789" required>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Alamat Lengkap</label>
                <textarea v-model="form.address" class="form-input" rows="2" placeholder="Alamat pemasangan..."></textarea>
              </div>
            </div>

            <div class="form-section" style="margin-top: 24px;">
              <h4 style="margin-bottom: 12px; color: var(--text-primary); font-size: 14px;">Konfigurasi Internet & PPPoE</h4>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Router MikroTik <span class="required">*</span></label>
                  <select v-model="form.router_id" class="form-input" required>
                    <option value="" disabled>--- Pilih Router ---</option>
                    <option v-for="r in mikrotiks" :key="r.id" :value="r.id">{{ r.name }}</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Paket Internet <span class="required">*</span></label>
                  <select v-model="form.package_id" class="form-input" required>
                    <option value="" disabled>--- Pilih Paket ---</option>
                    <option v-for="p in packages" :key="p.id" :value="p.id">{{ p.name }} - {{ formatPrice(p.price) }}</option>
                  </select>
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Username PPPoE <span class="required">*</span></label>
                  <input v-model="form.pppoe_username" type="text" class="form-input" placeholder="Contoh: budi_net" :disabled="editingCustomer" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Password PPPoE</label>
                  <input v-model="form.pppoe_password" type="text" class="form-input" placeholder="Isi password baru" :required="!editingCustomer">
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Tanggal Join <span class="required">*</span></label>
                  <input v-model="form.join_date" type="date" class="form-input" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Tgl Penagihan (1-31) <span class="required">*</span></label>
                  <input v-model="form.billing_date" type="number" min="1" max="31" class="form-input" required placeholder="Contoh: 10">
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Catatan</label>
                <input v-model="form.notes" type="text" class="form-input" placeholder="Opsional">
              </div>
            </div>
          </div>

          <div class="modal-footer" style="justify-content: space-between;">
            <div class="info-text" v-if="!editingCustomer" style="font-size: 11px; color: var(--text-muted); display: flex; align-items: center; gap: 6px; max-width: 60%;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
              Login portal dibuat otomatis via PPPoE Username & 6 digit HP.
            </div>
            <div v-else></div>
            <div style="display: flex; gap: 10px;">
              <button type="button" class="btn btn-secondary" @click="closeForm()">Batal</button>
              <button type="submit" class="btn btn-primary" :disabled="submitting">
                <span v-if="submitting" class="spinner"></span>
                {{ submitting ? 'Memproses...' : (editingCustomer ? 'Update' : 'Simpan') }}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>

    <!-- Sync Modal -->
    <div v-if="showSyncModal" class="modal-overlay">
      <div class="modal-content" style="max-width: 400px;">
        <div class="modal-header">
          <h3>Sinkronisasi dari MikroTik</h3>
          <button class="close-btn" @click="showSyncModal = false">&times;</button>
        </div>
        <div class="modal-body">
          <p style="margin-bottom: 15px; font-size: 14px; color: var(--text-muted);">
            Sistem akan mengambil semua PPPoE Secrets dari router dan menambahkannya ke database jika belum ada.
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
  name: 'CustomerManagement',
  props: {
    mikrotiks: { type: Array, default: () => [] }
  },
  data() {
    return {
      customers: [],
      packages: [],
      loading: true,
      submitting: false,
      searchQuery: '',
      sortBy: 'name_asc',
      viewMode: 'table',
      showForm: false,
      editingCustomer: null,
      showSyncModal: false,
      selectedRouterForSync: '',
      syncing: false,
      form: {
        name: '',
        phone: '',
        address: '',
        pppoe_username: '',
        pppoe_password: '',
        router_id: '',
        package_id: '',
        join_date: new Date().toISOString().split('T')[0],
        billing_date: new Date().getDate(),
        notes: ''
      }
    };
  },
  computed: {
    filteredAndSortedCustomers() {
      const q = this.searchQuery.trim().toLowerCase();
      let result = this.customers;

      if (q) {
        result = result.filter(c => 
          (c.name || '').toLowerCase().includes(q) || 
          (c.phone || '').toLowerCase().includes(q) || 
          (c.pppoe_username || '').toLowerCase().includes(q) ||
          (c.package_name || '').toLowerCase().includes(q) ||
          (c.status || '').toLowerCase().includes(q)
        );
      }

      return [...result].sort((a, b) => {
        if (this.sortBy === 'name_asc') return (a.name || '').localeCompare(b.name || '');
        if (this.sortBy === 'name_desc') return (b.name || '').localeCompare(a.name || '');
        if (this.sortBy === 'package_asc') return (a.package_name || '').localeCompare(b.package_name || '');
        if (this.sortBy === 'price_asc') return Number(a.package_price || 0) - Number(b.package_price || 0);
        if (this.sortBy === 'price_desc') return Number(b.package_price || 0) - Number(a.package_price || 0);
        if (this.sortBy === 'billing_date_asc') return Number(a.billing_date || 0) - Number(b.billing_date || 0);
        if (this.sortBy === 'status_asc') return (a.status || '').localeCompare(b.status || '');
        return 0;
      });
    }
  },
  mounted() {
    this.loadData();
  },
  methods: {
    async loadData() {
      this.loading = true;
      try {
        const [resCust, resPkgs] = await Promise.all([
          apiService.getCustomers(),
          apiService.getPackages()
        ]);
        if (resCust.success) this.customers = resCust.data;
        if (resPkgs.success) this.packages = resPkgs.data;
      } catch (err) {
        console.error('Failed to load customers:', err);
      } finally {
        this.loading = false;
      }
    },
    formatPrice(price) {
      return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);
    },
    openForm(cust = null) {
      if (cust) {
        this.editingCustomer = cust;
        this.form = { 
          ...cust,
          pppoe_password: '', // Don't show password for edit
          join_date: cust.join_date ? cust.join_date.split('T')[0] : ''
        };
      } else {
        this.editingCustomer = null;
        this.form = {
          name: '',
          phone: '',
          address: '',
          pppoe_username: '',
          pppoe_password: '',
          router_id: '',
          package_id: '',
          join_date: new Date().toISOString().split('T')[0],
          billing_date: new Date().getDate(),
          notes: ''
        };
      }
      this.showForm = true;
    },
    closeForm() {
      this.showForm = false;
    },
    async saveCustomer() {
      this.submitting = true;
      try {
        let res;
        if (this.editingCustomer) {
          res = await apiService.updateCustomer(this.editingCustomer.id, this.form);
        } else {
          res = await apiService.addCustomer(this.form);
        }

        if (res.success) {
          this.closeForm();
          this.loadData();
          if (!this.editingCustomer) {
            alert(res.message);
          }
        } else {
          alert('Gagal: ' + res.error);
        }
      } catch (err) {
        alert('Error: ' + err.message);
      } finally {
        this.submitting = false;
      }
    },
    async handleSync() {
      if (!this.selectedRouterForSync) return;
      
      this.syncing = true;
      try {
        const res = await apiService.syncCustomersFromMikrotik(this.selectedRouterForSync);
        if (res.success) {
          alert(res.message);
          this.showSyncModal = false;
          this.loadData();
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
    async deleteCustomer(cust) {
      if (!confirm(`Hapus pelanggan ${cust.name}? Secret PPPoE di MikroTik juga akan dihapus.`)) return;
      try {
        const res = await apiService.deleteCustomer(cust.id);
        if (res.success) this.loadData();
        else alert(res.error);
      } catch (err) {
        alert('Gagal menghapus pelanggan.');
      }
    },
    async suspendCustomer(cust) {
      if (!confirm(`Isolir layanan untuk ${cust.name}? Internet akan dinonaktifkan.`)) return;
      try {
        const res = await apiService.suspendCustomer(cust.id);
        if (res.success) this.loadData();
      } catch (err) {
        alert('Gagal mengisolir pelanggan.');
      }
    },
    async activateCustomer(cust) {
      try {
        const res = await apiService.activateCustomer(cust.id);
        if (res.success) this.loadData();
      } catch (err) {
        alert('Gagal mengaktifkan pelanggan.');
      }
    }
  }
};
</script>

<style scoped>
.customer-management {
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

.stats-bar {
  display: flex;
  gap: 32px;
  background: var(--bg-card);
  padding: 16px 24px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-card);
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-size: 11px;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stat-label.active { color: #22c55e; }
.stat-label.suspended { color: #ef4444; }

.stat-value {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
}

.table-card {
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

.table-container {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.data-table th {
  padding: 14px 24px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  background: rgba(248, 250, 252, 0.05);
  border-bottom: 1px solid var(--border-subtle);
}

.data-table td {
  padding: 16px 24px;
  border-bottom: 1px solid var(--border-subtle);
  vertical-align: middle;
}

.customer-info .name { font-weight: 600; color: var(--text-primary); }
.customer-info .phone { font-size: 12px; color: var(--text-muted); margin-top: 2px; }

.package-info .pkg-name { font-weight: 600; color: var(--accent-blue); }
.package-info .pkg-price { font-size: 12px; color: var(--text-muted); margin-top: 2px; }

.pppoe-info .badge { font-size: 11px; margin-bottom: 4px; display: inline-block; }
.pppoe-info .router { font-size: 11px; color: var(--text-muted); }

.status-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 4px 8px;
  border-radius: 6px;
}

.status-badge.active { background: rgba(34, 197, 94, 0.1); color: #22c55e; }
.status-badge.suspended { background: rgba(239, 68, 68, 0.1); color: #ef4444; }

.btn-group {
  display: flex;
  gap: 8px;
}

.actions {
  width: 132px;
}

.btn-icon {
  width: 34px;
  height: 34px;
  padding: 0;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-glass);
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.btn-icon svg {
  width: 16px;
  height: 16px;
  stroke: currentColor;
}

.btn-icon:hover,
.btn-icon.edit:hover {
  color: var(--accent-blue);
  border-color: var(--accent-blue);
  background: rgba(59, 130, 246, 0.12);
}

.btn-icon.warning {
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.1);
  border-color: rgba(245, 158, 11, 0.2);
}

.btn-icon.warning:hover {
  background: rgba(245, 158, 11, 0.16);
  border-color: #f59e0b;
}

.btn-icon.success {
  color: #22c55e;
  background: rgba(34, 197, 94, 0.1);
  border-color: rgba(34, 197, 94, 0.2);
}

.btn-icon.success:hover {
  background: rgba(34, 197, 94, 0.16);
  border-color: #22c55e;
}

.btn-icon.danger {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.2);
}

.btn-icon.danger:hover {
  background: rgba(239, 68, 68, 0.16);
  border-color: #ef4444;
}

.btn-icon.view-mode {
  width: 32px;
  height: 32px;
  color: var(--text-muted);
  background: transparent;
}

.btn-icon.view-mode.active {
  color: var(--accent-blue);
  background: rgba(59, 130, 246, 0.14);
  border-color: rgba(59, 130, 246, 0.35);
}

.customer-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  padding: 20px 24px 24px;
}

.customer-card {
  background: var(--bg-card);
  border: 1px solid var(--border-card);
  border-radius: var(--radius-lg);
  padding: 24px;
  position: relative;
  display: flex;
  flex-direction: column;
  transition: all 0.2s ease;
  box-shadow: 0 4px 20px rgba(0,0,0,0.05);
}

.customer-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 30px rgba(0,0,0,0.12);
  border-color: var(--accent-blue);
}

.customer-card.suspended {
  opacity: 0.7;
  filter: grayscale(0.5);
}

.customer-card-status {
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

.customer-card-status.active {
  background: rgba(34, 197, 94, 0.1);
  color: #22c55e;
}

.customer-card-status.suspended {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.customer-card-icon {
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

.customer-card-icon svg {
  width: 24px;
  height: 24px;
}

.customer-card-content {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.customer-card-content h3 {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 12px;
}

.customer-meta {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.meta-item {
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

.meta-item svg {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.customer-profile-badge {
  font-size: 11px;
  color: var(--text-muted);
  margin-bottom: 8px;
}

.customer-package-name {
  display: inline-flex;
  width: fit-content;
  max-width: 100%;
  margin-top: 4px;
  margin-bottom: 10px;
  padding: 4px 8px;
  border-radius: 6px;
  background: rgba(59, 130, 246, 0.1);
  color: var(--accent-blue);
  font-size: 12px;
  font-weight: 700;
}

.customer-price-tag {
  font-size: 22px;
  font-weight: 800;
  color: var(--accent-blue);
  margin-top: auto;
}

.customer-price-tag span {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-muted);
}

.customer-card-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--border-subtle);
}

.empty-grid {
  grid-column: 1 / -1;
  padding: 36px;
  text-align: center;
  color: var(--text-muted);
}

.empty-row {
  text-align: center;
  padding: 40px !important;
  color: var(--text-muted);
}

@media (max-width: 720px) {
  .panel-header {
    align-items: flex-start;
    flex-direction: column;
    gap: 16px;
  }

  .header-right,
  .toolbar-left {
    width: 100%;
    flex-wrap: wrap;
  }

  .search-box,
  .sort-select {
    max-width: none;
    width: 100%;
  }
}

/* Modal sections */

.form-section {
  margin-bottom: 24px;
}

.form-section h4 {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-secondary);
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-subtle);
}

.form-group.full {
  grid-column: span 2;
}

.info-text {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: var(--text-muted);
  background: rgba(91, 76, 245, 0.05);
  padding: 8px 12px;
  border-radius: 8px;
  max-width: 400px;
}

.spacer { flex: 1; }
</style>
