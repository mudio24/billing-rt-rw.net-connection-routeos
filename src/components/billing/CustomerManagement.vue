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
        <div class="search-box">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input v-model="searchQuery" type="text" placeholder="Cari pelanggan (nama/HP/PPPoE)...">
        </div>
      </div>

      <div v-if="loading" class="loading-state">
        <span class="spinner"></span> Memuat data pelanggan...
      </div>

      <div v-else class="table-container">
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
            <tr v-for="c in filteredCustomers" :key="c.id">
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
                  <div class="router">Router ID: {{ c.router_id }}</div>
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
            <tr v-if="filteredCustomers.length === 0">
              <td colspan="6" class="empty-row">Tidak ada data pelanggan yang cocok.</td>
            </tr>
          </tbody>
        </table>
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
                  <label class="form-label">Catatan</label>
                  <input v-model="form.notes" type="text" class="form-input" placeholder="Opsional">
                </div>
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
        notes: ''
      }
    };
  },
  computed: {
    filteredCustomers() {
      if (!this.searchQuery) return this.customers;
      const q = this.searchQuery.toLowerCase();
      return this.customers.filter(c => 
        c.name.toLowerCase().includes(q) || 
        c.phone.includes(q) || 
        c.pppoe_username.toLowerCase().includes(q)
      );
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
  padding: 16px 24px;
  border-bottom: 1px solid var(--border-subtle);
}

.search-box {
  position: relative;
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

.empty-row {
  text-align: center;
  padding: 40px !important;
  color: var(--text-muted);
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
