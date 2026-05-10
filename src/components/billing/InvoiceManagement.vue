<template>
  <div class="invoice-management">
    <div class="panel-header">
      <div class="header-left">
        <h2>Tagihan & Invoice</h2>
        <p>Kelola invoice pelanggan, konfirmasi pembayaran, dan status piutang.</p>
      </div>
      <div class="header-right">
        <button class="btn btn-secondary" @click="loadData()" :disabled="loading">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10"></path><path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14"></path></svg>
          Refresh
        </button>
        <button class="btn btn-primary" @click="generateTodayInvoices" :disabled="generating">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>
          {{ generating ? 'Membuat...' : 'Generate Hari Ini' }}
        </button>
      </div>
    </div>

    <div class="invoice-stats">
      <div class="invoice-stat">
        <span class="invoice-stat-label">Total</span>
        <span class="invoice-stat-value">{{ invoices.length }}</span>
      </div>
      <div class="invoice-stat">
        <span class="invoice-stat-label pending">Pending</span>
        <span class="invoice-stat-value">{{ invoices.filter(i => i.status === 'pending').length }}</span>
      </div>
      <div class="invoice-stat">
        <span class="invoice-stat-label paid">Lunas</span>
        <span class="invoice-stat-value">{{ invoices.filter(i => i.status === 'paid').length }}</span>
      </div>
      <div class="invoice-stat">
        <span class="invoice-stat-label overdue">Overdue</span>
        <span class="invoice-stat-value">{{ invoices.filter(i => i.status === 'overdue').length }}</span>
      </div>
    </div>

    <div class="table-card">
      <div class="table-toolbar">
        <div class="toolbar-left">
          <div class="invoice-search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input v-model="searchQuery" type="text" placeholder="Cari invoice, pelanggan, HP, paket...">
          </div>
          <select v-model="filterStatus" class="invoice-select" @change="loadData">
            <option value="">Semua Status</option>
            <option value="pending">Pending</option>
            <option value="paid">Lunas</option>
            <option value="overdue">Jatuh Tempo</option>
            <option value="cancelled">Dibatalkan</option>
          </select>
          <select v-model="sortBy" class="invoice-select">
            <option value="created_desc">Terbaru</option>
            <option value="created_asc">Terlama</option>
            <option value="due_asc">Jatuh Tempo Terdekat</option>
            <option value="due_desc">Jatuh Tempo Terjauh</option>
            <option value="amount_asc">Jumlah Terendah</option>
            <option value="amount_desc">Jumlah Tertinggi</option>
            <option value="customer_asc">Pelanggan A-Z</option>
            <option value="status_asc">Status</option>
          </select>
        </div>
        <div class="view-toggle">
          <button type="button" class="invoice-view-button" :class="{ active: viewMode === 'grid' }" @click="viewMode = 'grid'" title="Tampilan Grid">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
          </button>
          <button type="button" class="invoice-view-button" :class="{ active: viewMode === 'table' }" @click="viewMode = 'table'" title="Tampilan Tabel">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
          </button>
        </div>
      </div>

      <div v-if="loading" class="loading-state">
        <span class="spinner"></span> Memuat invoice...
      </div>

      <div v-else-if="viewMode === 'table'" class="table-container">
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
            <tr v-for="inv in filteredAndSortedInvoices" :key="inv.id">
              <td>
                <div class="inv-number">{{ inv.invoice_number }}</div>
                <div class="inv-date">{{ formatDate(inv.created_at) }}</div>
              </td>
              <td>
                <div class="customer-info">
                  <div class="name">{{ inv.customer_name || '-' }}</div>
                  <div class="phone">{{ inv.customer_phone || '-' }}</div>
                </div>
              </td>
              <td>
                <div class="period">{{ formatDate(inv.period_start, true) }} - {{ formatDate(inv.period_end, true) }}</div>
              </td>
              <td class="amount">{{ formatPrice(inv.amount) }}</td>
              <td>
                <div class="due-date" :class="{ 'text-danger': isOverdue(inv.due_date) && inv.status === 'pending' }">
                  {{ formatDate(inv.due_date) }}
                </div>
              </td>
              <td>
                <span class="invoice-status-badge" :class="inv.status">{{ statusText(inv.status) }}</span>
              </td>
              <td class="actions">
                <div class="btn-group">
                  <button v-if="inv.status === 'pending'" class="invoice-action success" @click="markPaid(inv)" title="Tandai Lunas">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </button>
                  <button class="invoice-action view" @click="openDetail(inv)" title="Lihat Detail">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  </button>
                  <button v-if="inv.status === 'pending'" class="invoice-action pay" @click="openPaymentLink(inv)" title="Link Pembayaran">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>
                  </button>
                  <button class="invoice-action print" @click="printInvoice(inv)" title="Cetak/Download">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9V2h12v7"></path><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                  </button>
                  <button v-if="inv.status === 'pending' || inv.status === 'overdue'" class="invoice-action sync" @click="checkStatus(inv)" title="Cek Status">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10"></path><path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14"></path></svg>
                  </button>
                  <button v-if="inv.status === 'pending'" class="invoice-action danger" @click="cancelInvoice(inv)" title="Batalkan">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="filteredAndSortedInvoices.length === 0">
              <td colspan="7" class="empty-row">Tidak ada data invoice.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="invoice-grid">
        <div v-for="inv in filteredAndSortedInvoices" :key="inv.id" class="invoice-card" :class="inv.status">
          <div class="invoice-card-status" :class="inv.status">{{ statusText(inv.status) }}</div>
          <div class="invoice-card-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
          </div>
          <div class="invoice-card-content">
            <h3>{{ inv.invoice_number }}</h3>
            <div class="invoice-meta">
              <div class="meta-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                <span>{{ formatDate(inv.due_date, true) }}</span>
              </div>
              <div class="meta-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                <span>{{ inv.customer_name || '-' }}</span>
              </div>
            </div>
            <div class="invoice-profile-badge">Paket: {{ inv.package_name || '-' }}</div>
            <div class="invoice-profile-badge">Periode: {{ formatDate(inv.period_start, true) }} - {{ formatDate(inv.period_end, true) }}</div>
            <div class="invoice-amount-tag">{{ formatPrice(inv.amount) }}</div>
          </div>
          <div class="invoice-card-actions">
            <button v-if="inv.status === 'pending'" class="invoice-action success" @click="markPaid(inv)" title="Tandai Lunas">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </button>
            <button class="invoice-action view" @click="openDetail(inv)" title="Lihat Detail">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            </button>
            <button v-if="inv.status === 'pending'" class="invoice-action pay" @click="openPaymentLink(inv)" title="Link Pembayaran">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>
            </button>
            <button class="invoice-action print" @click="printInvoice(inv)" title="Cetak/Download">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9V2h12v7"></path><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
            </button>
            <button v-if="inv.status === 'pending' || inv.status === 'overdue'" class="invoice-action sync" @click="checkStatus(inv)" title="Cek Status">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10"></path><path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14"></path></svg>
            </button>
            <button v-if="inv.status === 'pending'" class="invoice-action danger" @click="cancelInvoice(inv)" title="Batalkan">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
        </div>
        <div v-if="filteredAndSortedInvoices.length === 0" class="empty-grid">Tidak ada data invoice.</div>
      </div>
    </div>

    <div v-if="selectedInvoice" class="modal-overlay" @click.self="closeDetail()">
      <div class="modal-content detail-modal">
        <div class="modal-header">
          <h2 class="modal-title">Detail Invoice</h2>
          <button class="modal-close" @click="closeDetail()">Tutup</button>
        </div>
        <div class="modal-body">
          <div class="detail-header">
            <div>
              <p class="detail-label">No. Invoice</p>
              <h3>{{ selectedInvoice.invoice_number }}</h3>
            </div>
            <span class="invoice-status-badge detail-status" :class="selectedInvoice.status">{{ statusText(selectedInvoice.status) }}</span>
          </div>
          <div class="detail-grid">
            <div class="detail-item"><span>Pelanggan</span><strong>{{ selectedInvoice.customer_name || '-' }}</strong></div>
            <div class="detail-item"><span>No. HP</span><strong>{{ selectedInvoice.customer_phone || '-' }}</strong></div>
            <div class="detail-item"><span>Paket</span><strong>{{ selectedInvoice.package_name || '-' }}</strong></div>
            <div class="detail-item"><span>Jumlah</span><strong>{{ formatPrice(selectedInvoice.amount) }}</strong></div>
            <div class="detail-item"><span>Periode</span><strong>{{ formatDate(selectedInvoice.period_start, true) }} - {{ formatDate(selectedInvoice.period_end, true) }}</strong></div>
            <div class="detail-item"><span>Jatuh Tempo</span><strong>{{ formatDate(selectedInvoice.due_date) }}</strong></div>
            <div class="detail-item"><span>Dibuat</span><strong>{{ formatDate(selectedInvoice.created_at) }}</strong></div>
            <div class="detail-item"><span>Dibayar Via</span><strong>{{ selectedInvoice.paid_via || '-' }}</strong></div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="closeDetail()">Tutup</button>
          <button v-if="selectedInvoice.status === 'pending'" type="button" class="btn btn-secondary" @click="openPaymentLink(selectedInvoice)">Link Bayar</button>
          <button type="button" class="btn btn-primary" @click="printInvoice(selectedInvoice)">Cetak</button>
        </div>
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
      generating: false,
      filterStatus: '',
      searchQuery: '',
      sortBy: 'created_desc',
      viewMode: 'table',
      selectedInvoice: null
    };
  },
  computed: {
    filteredAndSortedInvoices() {
      const q = this.searchQuery.trim().toLowerCase();
      let result = this.invoices;

      if (q) {
        result = result.filter(inv =>
          (inv.invoice_number || '').toLowerCase().includes(q) ||
          (inv.customer_name || '').toLowerCase().includes(q) ||
          (inv.customer_phone || '').toLowerCase().includes(q) ||
          (inv.package_name || '').toLowerCase().includes(q) ||
          (inv.status || '').toLowerCase().includes(q)
        );
      }

      return [...result].sort((a, b) => {
        if (this.sortBy === 'created_desc') return new Date(b.created_at || 0) - new Date(a.created_at || 0);
        if (this.sortBy === 'created_asc') return new Date(a.created_at || 0) - new Date(b.created_at || 0);
        if (this.sortBy === 'due_asc') return new Date(a.due_date || 0) - new Date(b.due_date || 0);
        if (this.sortBy === 'due_desc') return new Date(b.due_date || 0) - new Date(a.due_date || 0);
        if (this.sortBy === 'amount_asc') return Number(a.amount || 0) - Number(b.amount || 0);
        if (this.sortBy === 'amount_desc') return Number(b.amount || 0) - Number(a.amount || 0);
        if (this.sortBy === 'customer_asc') return (a.customer_name || '').localeCompare(b.customer_name || '');
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
      return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price || 0);
    },
    formatDate(dateStr, short = false) {
      if (!dateStr) return '-';
      const options = short ? { day: 'numeric', month: 'short' } : { day: 'numeric', month: 'short', year: 'numeric' };
      return new Date(dateStr).toLocaleDateString('id-ID', options);
    },
    statusText(status) {
      const labels = {
        pending: 'Pending',
        paid: 'Lunas',
        overdue: 'Jatuh Tempo',
        cancelled: 'Dibatalkan'
      };
      return labels[status] || status || '-';
    },
    isOverdue(dueDate) {
      return new Date(dueDate) < new Date();
    },
    async openDetail(inv) {
      this.selectedInvoice = inv;
      try {
        const res = await apiService.getInvoice(inv.id);
        if (res.success) this.selectedInvoice = res.data;
      } catch (err) {
        alert('Gagal membaca detail invoice terbaru.');
      }
    },
    closeDetail() {
      this.selectedInvoice = null;
    },
    async generateTodayInvoices() {
      if (!confirm('Generate invoice untuk pelanggan yang jatuh tempo hari ini?')) return;
      this.generating = true;
      try {
        const res = await apiService.generateInvoicesToday();
        if (res.success) {
          alert(`Generate selesai. Berhasil: ${res.generated}, gagal: ${res.failed}.`);
          this.loadData();
        } else {
          alert(res.error || 'Gagal generate invoice.');
        }
      } catch (err) {
        alert('Gagal generate invoice.');
      } finally {
        this.generating = false;
      }
    },
    async markPaid(inv) {
      if (!confirm(`Tandai invoice ${inv.invoice_number} sebagai LUNAS (manual)?`)) return;
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
        else alert(res.error);
      } catch (err) {
        alert('Gagal membatalkan invoice.');
      }
    },
    async openPaymentLink(inv) {
      try {
        const res = await apiService.getPaymentLink(inv.id);
        if (res.success && res.url) {
          window.open(res.url, '_blank', 'noopener,noreferrer');
          this.loadData();
        } else {
          alert(res.error || 'Gagal membuat link pembayaran.');
        }
      } catch (err) {
        alert('Gagal membuat link pembayaran.');
      }
    },
    async checkStatus(inv) {
      try {
        const res = await apiService.checkInvoiceStatus(inv.id);
        alert(res.message || `Status invoice: ${res.status || '-'}`);
        this.loadData();
      } catch (err) {
        alert('Gagal mengecek status invoice.');
      }
    },
    escapeHtml(value) {
      return String(value ?? '-')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    },
    async printInvoice(inv) {
      let invoice = inv;
      try {
        const res = await apiService.getInvoice(inv.id);
        if (res.success) invoice = res.data;
      } catch (err) {
        invoice = inv;
      }

      const printable = window.open('', '_blank', 'width=900,height=700');
      if (!printable) {
        alert('Browser memblokir jendela cetak.');
        return;
      }

      const status = this.statusText(invoice.status);
      const invoiceNumber = this.escapeHtml(invoice.invoice_number);
      const customerName = this.escapeHtml(invoice.customer_name || '-');
      const customerPhone = this.escapeHtml(invoice.customer_phone || '-');
      const customerAddress = this.escapeHtml(invoice.customer_address || '-');
      const packageName = this.escapeHtml(invoice.package_name || '-');
      const speed = [invoice.speed_up, invoice.speed_down].filter(Boolean).join(' / ') || '-';
      const paidVia = this.escapeHtml(invoice.paid_via || '-');
      const paymentUrl = invoice.xendit_invoice_url || '';
      const amount = Number(invoice.amount || 0);
      const generatedAt = new Date().toLocaleString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      printable.document.write(`
        <html>
          <head>
            <title>${invoiceNumber}</title>
            <style>
              * { box-sizing: border-box; }
              body {
                margin: 0;
                background: #f3f4f6;
                color: #111827;
                font-family: Arial, Helvetica, sans-serif;
                font-size: 13px;
                line-height: 1.45;
              }
              .page {
                width: 210mm;
                min-height: 297mm;
                margin: 0 auto;
                padding: 18mm;
                background: #fff;
              }
              .topbar {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                gap: 24px;
                padding-bottom: 18px;
                border-bottom: 3px solid #111827;
              }
              .brand {
                display: flex;
                gap: 12px;
                align-items: center;
              }
              .brand-mark {
                width: 46px;
                height: 46px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 10px;
                background: #2563eb;
                color: white;
                font-weight: 800;
                font-size: 18px;
              }
              .brand-title {
                font-size: 20px;
                font-weight: 800;
                letter-spacing: .02em;
              }
              .brand-subtitle,
              .muted {
                color: #6b7280;
                font-size: 12px;
              }
              .invoice-title {
                text-align: right;
              }
              .invoice-title h1 {
                margin: 0;
                font-size: 30px;
                line-height: 1;
                text-transform: uppercase;
              }
              .invoice-number {
                margin-top: 8px;
                font-family: Consolas, monospace;
                font-weight: 700;
              }
              .status {
                display: inline-flex;
                margin-top: 10px;
                padding: 6px 10px;
                border-radius: 999px;
                font-size: 11px;
                font-weight: 800;
                text-transform: uppercase;
                border: 1px solid #d1d5db;
              }
              .status.pending { color: #b45309; background: #fffbeb; border-color: #fde68a; }
              .status.paid { color: #047857; background: #ecfdf5; border-color: #a7f3d0; }
              .status.overdue { color: #b91c1c; background: #fef2f2; border-color: #fecaca; }
              .status.cancelled { color: #475569; background: #f1f5f9; border-color: #cbd5e1; }
              .section {
                margin-top: 22px;
              }
              .section-title {
                margin-bottom: 10px;
                color: #374151;
                font-size: 12px;
                font-weight: 800;
                text-transform: uppercase;
                letter-spacing: .06em;
              }
              .info-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 14px;
              }
              .box {
                min-height: 92px;
                padding: 14px;
                border: 1px solid #e5e7eb;
                border-radius: 10px;
                background: #f9fafb;
              }
              .box h3 {
                margin: 0 0 8px;
                font-size: 15px;
              }
              .kv {
                display: grid;
                grid-template-columns: 120px 1fr;
                gap: 8px;
                margin-top: 5px;
              }
              .kv span:first-child {
                color: #6b7280;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                overflow: hidden;
                border: 1px solid #e5e7eb;
                border-radius: 10px;
              }
              th {
                background: #111827;
                color: #fff;
                font-size: 12px;
                text-transform: uppercase;
                letter-spacing: .04em;
              }
              th, td {
                padding: 12px;
                text-align: left;
                border-bottom: 1px solid #e5e7eb;
              }
              tbody tr:last-child td {
                border-bottom: none;
              }
              .right {
                text-align: right;
              }
              .summary {
                display: flex;
                justify-content: flex-end;
                margin-top: 16px;
              }
              .summary-box {
                width: 310px;
                border: 1px solid #e5e7eb;
                border-radius: 10px;
                overflow: hidden;
              }
              .summary-row {
                display: flex;
                justify-content: space-between;
                padding: 11px 14px;
                border-bottom: 1px solid #e5e7eb;
              }
              .summary-row.total {
                background: #eff6ff;
                border-bottom: none;
                color: #1d4ed8;
                font-size: 18px;
                font-weight: 800;
              }
              .payment-note {
                padding: 14px;
                border: 1px solid #dbeafe;
                border-radius: 10px;
                background: #eff6ff;
                color: #1e3a8a;
              }
              .payment-url {
                margin-top: 8px;
                word-break: break-all;
                font-family: Consolas, monospace;
                font-size: 11px;
              }
              .footer {
                display: flex;
                justify-content: space-between;
                gap: 24px;
                margin-top: 38px;
                padding-top: 18px;
                border-top: 1px solid #e5e7eb;
                color: #6b7280;
                font-size: 12px;
              }
              .signature {
                width: 180px;
                text-align: center;
                color: #111827;
              }
              .signature-line {
                margin-top: 54px;
                border-top: 1px solid #111827;
                padding-top: 6px;
                font-weight: 700;
              }
              @page { size: A4; margin: 0; }
              @media print {
                body { background: #fff; }
                .page { width: auto; min-height: auto; margin: 0; padding: 14mm; }
              }
            </style>
          </head>
          <body>
            <main class="page">
              <section class="topbar">
                <div class="brand">
                  <div class="brand-mark">DC</div>
                  <div>
                    <div class="brand-title">DIONIT CELL</div>
                    <div class="brand-subtitle">Layanan Internet & MikroTik Management</div>
                    <div class="muted">Dokumen invoice pelanggan</div>
                  </div>
                </div>
                <div class="invoice-title">
                  <h1>Invoice</h1>
                  <div class="invoice-number">${invoiceNumber}</div>
                  <div class="status ${this.escapeHtml(invoice.status)}">${this.escapeHtml(status)}</div>
                </div>
              </section>

              <section class="section info-grid">
                <div class="box">
                  <div class="section-title">Ditagihkan Kepada</div>
                  <h3>${customerName}</h3>
                  <div class="kv"><span>No. HP</span><strong>${customerPhone}</strong></div>
                  <div class="kv"><span>Alamat</span><strong>${customerAddress}</strong></div>
                </div>
                <div class="box">
                  <div class="section-title">Informasi Invoice</div>
                  <div class="kv"><span>Tanggal Dibuat</span><strong>${this.formatDate(invoice.created_at)}</strong></div>
                  <div class="kv"><span>Jatuh Tempo</span><strong>${this.formatDate(invoice.due_date)}</strong></div>
                  <div class="kv"><span>Dibayar Via</span><strong>${paidVia}</strong></div>
                </div>
              </section>

              <section class="section">
                <div class="section-title">Rincian Layanan</div>
                <table>
                  <thead>
                    <tr>
                      <th>Deskripsi</th>
                      <th>Periode</th>
                      <th>Speed</th>
                      <th class="right">Jumlah</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <strong>${packageName}</strong>
                        <div class="muted">Tagihan layanan internet bulanan</div>
                      </td>
                      <td>${this.formatDate(invoice.period_start, true)} - ${this.formatDate(invoice.period_end, true)}</td>
                      <td>${this.escapeHtml(speed)}</td>
                      <td class="right"><strong>${this.formatPrice(amount)}</strong></td>
                    </tr>
                  </tbody>
                </table>
              </section>

              <section class="summary">
                <div class="summary-box">
                  <div class="summary-row"><span>Subtotal</span><strong>${this.formatPrice(amount)}</strong></div>
                  <div class="summary-row"><span>Diskon / Penyesuaian</span><strong>${this.formatPrice(0)}</strong></div>
                  <div class="summary-row total"><span>Total Tagihan</span><span>${this.formatPrice(amount)}</span></div>
                </div>
              </section>

              <section class="section payment-note">
                <strong>Catatan Pembayaran</strong>
                <div>Mohon lakukan pembayaran sebelum tanggal jatuh tempo. Abaikan invoice ini apabila pembayaran sudah dikonfirmasi lunas.</div>
                ${paymentUrl ? `<div class="payment-url">Link pembayaran: ${this.escapeHtml(paymentUrl)}</div>` : ''}
              </section>

              <section class="footer">
                <div>
                  <strong>Dicetak:</strong> ${generatedAt}<br>
                  Invoice ini dibuat otomatis oleh sistem billing DIONIT CELL.
                </div>
                <div class="signature">
                  <div>Hormat kami,</div>
                  <div class="signature-line">DIONIT CELL</div>
                </div>
              </section>
            </main>
            <script>
              window.onload = () => {
                window.focus();
                window.print();
              };
            <\/script>
          </body>
        </html>
      `);
      printable.document.close();
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

.header-right {
  display: flex;
  gap: 10px;
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

.invoice-stats {
  display: flex;
  gap: 32px;
  background: var(--bg-card);
  padding: 16px 24px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-card);
}

.invoice-stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.invoice-stat-label {
  font-size: 11px;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.invoice-stat-label.pending { color: #f59e0b; }
.invoice-stat-label.paid { color: #22c55e; }
.invoice-stat-label.overdue { color: #ef4444; }

.invoice-stat-value {
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

.invoice-search {
  position: relative;
  flex: 1;
  max-width: 400px;
}

.invoice-search svg {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
}

.invoice-search input {
  width: 100%;
  padding: 10px 12px 10px 40px;
  background: var(--bg-input);
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  font-size: 14px;
  color: var(--text-primary);
  transition: all 0.2s;
}

.invoice-search input:focus,
.invoice-select:focus {
  border-color: var(--accent-blue);
  box-shadow: 0 0 0 4px rgba(91, 76, 245, 0.1);
  outline: none;
}

.invoice-select {
  min-width: 180px;
  padding: 10px 12px;
  background: var(--bg-input);
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  color: var(--text-primary);
  font-size: 14px;
  cursor: pointer;
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

.data-table tr:hover {
  background: rgba(255, 255, 255, 0.02);
}

.inv-number { font-weight: 700; color: var(--text-primary); font-family: monospace; font-size: 14px; }
.inv-date { font-size: 11px; color: var(--text-muted); margin-top: 2px; }
.customer-info .name { font-weight: 600; color: var(--text-primary); }
.customer-info .phone { font-size: 12px; color: var(--text-muted); }
.period { font-size: 13px; color: var(--text-secondary); }
.amount { font-weight: 700; color: var(--accent-blue); }
.text-danger { color: #ef4444; font-weight: 600; }

.invoice-status-badge,
.invoice-card-status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: fit-content;
  min-width: 58px;
  min-height: 24px;
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
  padding: 6px 10px;
  border-radius: 20px;
  text-transform: uppercase;
  white-space: nowrap;
  border: 1px solid transparent;
}

.invoice-status-badge.pending,
.invoice-card-status.pending {
  background: rgba(245, 158, 11, 0.12);
  border-color: rgba(245, 158, 11, 0.22);
  color: #f59e0b;
}

.invoice-status-badge.paid,
.invoice-card-status.paid {
  background: rgba(34, 197, 94, 0.12);
  border-color: rgba(34, 197, 94, 0.22);
  color: #22c55e;
}

.invoice-status-badge.overdue,
.invoice-card-status.overdue {
  background: rgba(239, 68, 68, 0.12);
  border-color: rgba(239, 68, 68, 0.22);
  color: #ef4444;
}

.invoice-status-badge.cancelled,
.invoice-card-status.cancelled {
  background: rgba(148, 163, 184, 0.14);
  border-color: rgba(148, 163, 184, 0.24);
  color: #94a3b8;
}

.btn-group {
  display: flex;
  gap: 8px;
}

.actions {
  width: 220px;
}

.invoice-action {
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

.invoice-action svg {
  width: 16px;
  height: 16px;
  stroke: currentColor;
}

.invoice-action:hover,
.invoice-action.print:hover,
.invoice-action.sync:hover {
  color: var(--accent-blue);
  border-color: var(--accent-blue);
  background: rgba(59, 130, 246, 0.12);
}

.invoice-action.view {
  color: #14b8a6;
  background: rgba(20, 184, 166, 0.1);
  border-color: rgba(20, 184, 166, 0.2);
}

.invoice-action.pay {
  color: #8b5cf6;
  background: rgba(139, 92, 246, 0.1);
  border-color: rgba(139, 92, 246, 0.2);
}

.invoice-action.success {
  color: #22c55e;
  background: rgba(34, 197, 94, 0.1);
  border-color: rgba(34, 197, 94, 0.2);
}

.invoice-action.danger {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.2);
}

.invoice-view-button {
  width: 32px;
  height: 32px;
  padding: 0;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  background: transparent;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
}

.invoice-view-button svg {
  width: 16px;
  height: 16px;
  stroke: currentColor;
}

.invoice-view-button.active {
  color: var(--accent-blue);
  background: rgba(59, 130, 246, 0.14);
  border-color: rgba(59, 130, 246, 0.35);
}

.invoice-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  padding: 20px 24px 24px;
}

.invoice-card {
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

.invoice-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 30px rgba(0,0,0,0.12);
  border-color: var(--accent-blue);
}

.invoice-card.cancelled {
  opacity: 0.7;
  filter: grayscale(0.5);
}

.invoice-card-status {
  position: absolute;
  top: 16px;
  right: 16px;
}

.invoice-card-icon {
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

.invoice-card-icon svg {
  width: 24px;
  height: 24px;
}

.invoice-card-content {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.invoice-card-content h3 {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 12px;
}

.invoice-meta {
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

.invoice-profile-badge {
  font-size: 11px;
  color: var(--text-muted);
  margin-bottom: 8px;
}

.invoice-amount-tag {
  font-size: 22px;
  font-weight: 800;
  color: var(--accent-blue);
  margin-top: auto;
}

.invoice-card-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--border-subtle);
}

.detail-modal {
  max-width: 620px;
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

.detail-item span {
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

.empty-row,
.empty-grid {
  text-align: center;
  padding: 40px !important;
  color: var(--text-muted);
}

.empty-grid {
  grid-column: 1 / -1;
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

  .invoice-search,
  .invoice-select {
    max-width: none;
    width: 100%;
  }
}
</style>
