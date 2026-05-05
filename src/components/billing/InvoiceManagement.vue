<template>
  <div class="invoice-management">
    <div class="panel-header">
      <div class="header-left">
        <h2>Tagihan & Invoice</h2>
        <p>Kelola invoice pelanggan, konfirmasi pembayaran, dan status piutang.</p>
      </div>
      <div class="header-right">
        <button class="btn btn-secondary" @click="loadData()">
          ↻ Refresh
        </button>
      </div>
    </div>

    <div class="table-card">
      <div class="table-toolbar">
        <div class="filters">
          <div class="filter-group">
            <label>Status</label>
            <select v-model="filterStatus" @change="loadData">
              <option value="">Semua Status</option>
              <option value="pending">Pending</option>
              <option value="paid">Lunas</option>
              <option value="overdue">Jatuh Tempo</option>
              <option value="cancelled">Dibatalkan</option>
            </select>
          </div>
        </div>
      </div>

      <div v-if="loading" class="loading-state">
        <span class="spinner"></span> Memuat invoice...
      </div>

      <div v-else class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>No. Invoice</th>
              <th>Pelanggan</th>
              <th>Periode</th>
              <th>Jumlah</th>
              <th>Jatuh Tempo</th>
              <th>Status</th>
              <th class="actions">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="inv in invoices" :key="inv.id">
              <td>
                <div class="inv-number">{{ inv.invoice_number }}</div>
                <div class="inv-date">{{ formatDate(inv.created_at) }}</div>
              </td>
              <td>
                <div class="customer-info">
                  <div class="name">{{ inv.customer_name }}</div>
                  <div class="phone">{{ inv.customer_phone }}</div>
                </div>
              </td>
              <td>
                <div class="period">
                  {{ formatDate(inv.period_start, true) }} - {{ formatDate(inv.period_end, true) }}
                </div>
              </td>
              <td class="amount">{{ formatPrice(inv.amount) }}</td>
              <td>
                <div class="due-date" :class="{ 'text-danger': isOverdue(inv.due_date) && inv.status === 'pending' }">
                  {{ formatDate(inv.due_date) }}
                </div>
              </td>
              <td>
                <span class="status-badge" :class="inv.status">
                  {{ inv.status.toUpperCase() }}
                </span>
              </td>
              <td class="actions">
                <div class="btn-group">
                  <button v-if="inv.status === 'pending'" class="btn-icon success" @click="markPaid(inv)" title="Tandai Lunas">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </button>
                  <button class="btn-icon" @click="printInvoice(inv)" title="Cetak/Download">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9V2h12v7"></path><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                  </button>
                  <button v-if="inv.status === 'pending'" class="btn-icon danger" @click="cancelInvoice(inv)" title="Batalkan">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="invoices.length === 0">
              <td colspan="7" class="empty-row">Tidak ada data invoice.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
import { apiService } from '@/services/api';

export default {
  name: 'InvoiceManagement',
  data() {
    return {
      invoices: [],
      loading: true,
      filterStatus: ''
    };
  },
  mounted() {
    this.loadData();
  },
  methods: {
    async loadData() {
      this.loading = true;
      try {
        const res = await apiService.getInvoices({ status: this.filterStatus });
        if (res.success) {
          this.invoices = res.data;
        }
      } catch (err) {
        console.error('Failed to load invoices:', err);
      } finally {
        this.loading = false;
      }
    },
    formatPrice(price) {
      return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);
    },
    formatDate(dateStr, short = false) {
      if (!dateStr) return '-';
      const options = short ? { day: 'numeric', month: 'short' } : { day: 'numeric', month: 'short', year: 'numeric' };
      return new Date(dateStr).toLocaleDateString('id-ID', options);
    },
    isOverdue(dueDate) {
      return new Date(dueDate) < new Date();
    },
    async markPaid(inv) {
      if (!confirm(`Tandai invoice ${inv.invoice_number} sebagai LUNAS (Manual)?`)) return;
      try {
        const res = await apiService.markInvoicePaid(inv.id);
        if (res.success) this.loadData();
        else alert(res.error);
      } catch (err) {
        alert('Gagal memproses pembayaran.');
      }
    },
    async cancelInvoice(inv) {
      if (!confirm(`Batalkan invoice ${inv.invoice_number}?`)) return;
      try {
        const res = await apiService.cancelInvoice(inv.id);
        if (res.success) this.loadData();
      } catch (err) {
        alert('Gagal membatalkan invoice.');
      }
    },
    printInvoice(inv) {
      // Logic for printing/downloading invoice (can be implemented later)
      alert('Fitur cetak invoice akan segera hadir.');
    }
  }
};
</script>

<style scoped>
.invoice-management {
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

.filter-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.filter-group label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
}

.filter-group select {
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid var(--border-subtle);
  background: var(--bg-input);
  color: var(--text-primary);
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

.inv-number { font-weight: 700; color: var(--text-primary); font-family: monospace; font-size: 14px; }
.inv-date { font-size: 11px; color: var(--text-muted); margin-top: 2px; }

.customer-info .name { font-weight: 600; color: var(--text-primary); }
.customer-info .phone { font-size: 12px; color: var(--text-muted); }

.period { font-size: 13px; color: var(--text-secondary); }
.amount { font-weight: 700; color: var(--accent-blue); }

.status-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 4px 8px;
  border-radius: 6px;
}

.status-badge.pending { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
.status-badge.paid { background: rgba(34, 197, 94, 0.1); color: #22c55e; }
.status-badge.overdue { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
.status-badge.cancelled { background: #f1f5f9; color: #64748b; }

.text-danger { color: #ef4444; font-weight: 600; }

.btn-group {
  display: flex;
  gap: 8px;
}

.empty-row {
  text-align: center;
  padding: 40px !important;
  color: var(--text-muted);
}
</style>
