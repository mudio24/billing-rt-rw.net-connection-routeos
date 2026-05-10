<template>
  <div class="expense-panel">
    <div class="panel-header">
      <div class="header-left">
        <h2>Pengeluaran</h2>
        <p>Catat dan kelola pengeluaran operasional ISP.</p>
      </div>
      <button class="btn-add" @click="showForm = true">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Tambah Pengeluaran
      </button>
    </div>

    <!-- Summary Cards -->
    <div class="summary-row">
      <div class="summary-card card-total">
        <div class="card-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 12H16c-.8 0-1.5.7-1.5 1.5v3c0 .8.7 1.5 1.5 1.5h5.5"/><rect x="2" y="6" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
        </div>
        <div class="card-body">
          <span class="card-label">Total Pengeluaran Bulan Ini</span>
          <span class="card-value">{{ formatCurrency(totalThisMonth) }}</span>
        </div>
      </div>
      <div class="summary-card card-count">
        <div class="card-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
        </div>
        <div class="card-body">
          <span class="card-label">Jumlah Transaksi</span>
          <span class="card-value">{{ expenses.length }}</span>
        </div>
      </div>
    </div>

    <!-- Filter -->
    <div class="filter-bar">
      <div class="filter-group">
        <label>Dari</label>
        <input type="date" v-model="filters.from" @change="loadExpenses">
      </div>
      <div class="filter-group">
        <label>Sampai</label>
        <input type="date" v-model="filters.to" @change="loadExpenses">
      </div>
      <div class="filter-group">
        <label>Kategori</label>
        <select v-model="filters.category" @change="loadExpenses">
          <option value="">Semua</option>
          <option value="bandwidth">Bandwidth / ISP</option>
          <option value="listrik">Listrik</option>
          <option value="gaji">Gaji Karyawan</option>
          <option value="perangkat">Perangkat / Alat</option>
          <option value="maintenance">Maintenance</option>
          <option value="lainnya">Lainnya</option>
        </select>
      </div>
    </div>

    <!-- Table -->
    <div class="table-card">
      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>Kategori</th>
              <th>Deskripsi</th>
              <th>Jumlah</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="expenses.length === 0">
              <td colspan="5" style="text-align:center; color:var(--text-muted); padding:32px;">Belum ada data pengeluaran.</td>
            </tr>
            <tr v-for="exp in expenses" :key="exp.id">
              <td>{{ formatDate(exp.expense_date) }}</td>
              <td><span class="badge-cat" :class="exp.category">{{ categoryLabel(exp.category) }}</span></td>
              <td>{{ exp.description }}</td>
              <td class="amount">{{ formatCurrency(exp.amount) }}</td>
              <td>
                <div class="action-btns">
                  <button class="btn-icon btn-edit" @click="editExpense(exp)" title="Edit">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button class="btn-icon btn-delete" @click="deleteExpense(exp)" title="Hapus">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <div v-if="showForm" class="modal-overlay" @click.self="closeForm">
      <div class="modal-content">
        <h3>{{ editingId ? 'Edit Pengeluaran' : 'Tambah Pengeluaran' }}</h3>
        <div class="form-group">
          <label>Tanggal</label>
          <input type="date" v-model="form.expense_date">
        </div>
        <div class="form-group">
          <label>Kategori</label>
          <select v-model="form.category">
            <option value="bandwidth">Bandwidth / ISP</option>
            <option value="listrik">Listrik</option>
            <option value="gaji">Gaji Karyawan</option>
            <option value="perangkat">Perangkat / Alat</option>
            <option value="maintenance">Maintenance</option>
            <option value="lainnya">Lainnya</option>
          </select>
        </div>
        <div class="form-group">
          <label>Deskripsi</label>
          <input type="text" v-model="form.description" placeholder="Contoh: Bayar bandwidth bulan Mei">
        </div>
        <div class="form-group">
          <label>Jumlah (Rp)</label>
          <input type="number" v-model.number="form.amount" placeholder="0">
        </div>
        <div class="form-group">
          <label>Catatan (opsional)</label>
          <textarea v-model="form.notes" rows="2" placeholder="Catatan tambahan..."></textarea>
        </div>
        <div class="modal-actions">
          <button class="btn-cancel" @click="closeForm">Batal</button>
          <button class="btn-save" @click="saveExpense" :disabled="saving">
            {{ saving ? 'Menyimpan...' : (editingId ? 'Update' : 'Simpan') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { apiService } from '@/services/api';

export default {
  name: 'ExpenseManagement',
  data() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return {
      expenses: [],
      filters: { from: `${y}-${m}-01`, to: `${y}-${m}-${d}`, category: '' },
      showForm: false,
      editingId: null,
      saving: false,
      form: { expense_date: `${y}-${m}-${d}`, category: 'bandwidth', description: '', amount: 0, notes: '' }
    };
  },
  computed: {
    totalThisMonth() {
      return this.expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    }
  },
  async mounted() {
    await this.loadExpenses();
  },
  methods: {
    async loadExpenses() {
      try {
        const params = { from: this.filters.from, to: this.filters.to };
        if (this.filters.category) params.category = this.filters.category;
        const res = await apiService.getExpenses(params);
        if (res.success) this.expenses = res.data;
      } catch (err) { console.error('Load expenses error:', err); }
    },
    async saveExpense() {
      if (!this.form.description || !this.form.amount) {
        alert('Deskripsi dan jumlah wajib diisi.');
        return;
      }
      this.saving = true;
      try {
        let res;
        if (this.editingId) {
          res = await apiService.updateExpense(this.editingId, this.form);
        } else {
          res = await apiService.createExpense(this.form);
        }
        if (res.success) {
          this.closeForm();
          await this.loadExpenses();
        } else {
          alert(res.error || 'Gagal menyimpan.');
        }
      } catch (err) {
        alert('Gagal menyimpan pengeluaran.');
      } finally {
        this.saving = false;
      }
    },
    editExpense(exp) {
      this.editingId = exp.id;
      this.form = {
        expense_date: exp.expense_date ? exp.expense_date.split('T')[0] : '',
        category: exp.category,
        description: exp.description,
        amount: exp.amount,
        notes: exp.notes || ''
      };
      this.showForm = true;
    },
    async deleteExpense(exp) {
      if (!confirm(`Hapus pengeluaran "${exp.description}"?`)) return;
      try {
        const res = await apiService.deleteExpense(exp.id);
        if (res.success) await this.loadExpenses();
        else alert(res.error || 'Gagal menghapus.');
      } catch (err) { alert('Gagal menghapus.'); }
    },
    closeForm() {
      this.showForm = false;
      this.editingId = null;
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const d = String(now.getDate()).padStart(2, '0');
      this.form = { expense_date: `${y}-${m}-${d}`, category: 'bandwidth', description: '', amount: 0, notes: '' };
    },
    formatCurrency(val) { return 'Rp ' + Number(val || 0).toLocaleString('id-ID'); },
    formatDate(d) {
      if (!d) return '-';
      return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    },
    categoryLabel(c) {
      const map = { bandwidth: 'Bandwidth', listrik: 'Listrik', gaji: 'Gaji', perangkat: 'Perangkat', maintenance: 'Maintenance', lainnya: 'Lainnya' };
      return map[c] || c;
    }
  }
};
</script>

<style scoped>
.expense-panel { display: flex; flex-direction: column; gap: 20px; }

.panel-header { display: flex; justify-content: space-between; align-items: center; }
.header-left h2 { font-size: 20px; font-weight: 700; color: var(--text-primary); margin-bottom: 4px; }
.header-left p { font-size: 13px; color: var(--text-muted); }

.btn-add {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 16px; background: #6366f1; color: white; border: none; border-radius: 8px;
  font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s;
}
.btn-add:hover { background: #4f46e5; }

/* Summary */
.summary-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.summary-card {
  display: flex; align-items: center; gap: 14px; padding: 20px;
  background: var(--bg-card); border: 1px solid var(--border-card); border-radius: 16px;
}
.card-icon {
  width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.card-total .card-icon { background: rgba(239, 68, 68, 0.12); color: #f87171; }
.card-count .card-icon { background: rgba(99, 102, 241, 0.12); color: #a5b4fc; }
.card-body { display: flex; flex-direction: column; gap: 2px; }
.card-label { font-size: 12px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; }
.card-value { font-size: 22px; font-weight: 800; color: var(--text-primary); }

/* Filter */
.filter-bar {
  display: flex; gap: 12px; align-items: flex-end; flex-wrap: wrap;
  padding: 16px 20px; background: var(--bg-card); border: 1px solid var(--border-card); border-radius: 16px;
}
.filter-group { display: flex; flex-direction: column; gap: 4px; }
.filter-group label { font-size: 11px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
.filter-group input, .filter-group select {
  padding: 7px 12px; background: var(--bg-input); border: 1px solid var(--border-subtle);
  border-radius: 8px; color: var(--text-primary); font-size: 13px; min-width: 140px;
}

/* Table */
.table-card { background: var(--bg-card); border: 1px solid var(--border-card); border-radius: 16px; padding: 20px; }
.table-scroll { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; }
thead th { text-align: left; padding: 10px 12px; font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; border-bottom: 1px solid var(--border-subtle); }
tbody td { padding: 10px 12px; font-size: 13px; color: var(--text-secondary); border-bottom: 1px solid var(--border-subtle); }
tbody tr:hover { background: var(--bg-glass); }
td.amount { font-weight: 700; color: var(--text-primary); white-space: nowrap; }

.badge-cat { display: inline-block; font-size: 10px; font-weight: 700; padding: 3px 10px; border-radius: 20px; }
.badge-cat.bandwidth { background: rgba(99, 102, 241, 0.1); color: #818cf8; }
.badge-cat.listrik { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
.badge-cat.gaji { background: rgba(34, 197, 94, 0.1); color: #22c55e; }
.badge-cat.perangkat { background: rgba(6, 182, 212, 0.1); color: #06b6d4; }
.badge-cat.maintenance { background: rgba(168, 85, 247, 0.1); color: #a855f7; }
.badge-cat.lainnya { background: rgba(100, 116, 139, 0.1); color: #94a3b8; }

.action-btns { display: flex; gap: 6px; }
.btn-icon { padding: 6px; border-radius: 6px; border: none; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; }
.btn-edit { background: rgba(99, 102, 241, 0.1); color: #a5b4fc; }
.btn-edit:hover { background: rgba(99, 102, 241, 0.2); }
.btn-delete { background: rgba(239, 68, 68, 0.1); color: #f87171; }
.btn-delete:hover { background: rgba(239, 68, 68, 0.2); }

/* Modal */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; justify-content: center; align-items: center; z-index: 999; }
.modal-content { background: var(--bg-card); border: 1px solid var(--border-card); border-radius: 16px; padding: 24px; width: 480px; max-width: 95vw; }
.modal-content h3 { font-size: 18px; font-weight: 700; color: var(--text-primary); margin-bottom: 20px; }
.form-group { margin-bottom: 14px; }
.form-group label { display: block; font-size: 12px; font-weight: 600; color: var(--text-muted); margin-bottom: 4px; }
.form-group input, .form-group select, .form-group textarea {
  width: 100%; padding: 8px 12px; background: var(--bg-input); border: 1px solid var(--border-subtle);
  border-radius: 8px; color: var(--text-primary); font-size: 13px;
}
.modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }
.btn-cancel { padding: 8px 16px; background: transparent; border: 1px solid var(--border-subtle); border-radius: 8px; color: var(--text-secondary); cursor: pointer; }
.btn-save { padding: 8px 20px; background: #6366f1; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; }
.btn-save:hover { background: #4f46e5; }
.btn-save:disabled { opacity: 0.6; cursor: not-allowed; }
</style>
