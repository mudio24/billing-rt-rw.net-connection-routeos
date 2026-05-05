<template>
  <div class="customer-portal">
    <div class="portal-header">
      <div class="header-left">
        <h2>Halo, {{ customer?.name }}!</h2>
        <p>Status Layanan: <span class="status-badge" :class="customer?.status">{{ customer?.status?.toUpperCase() }}</span></p>
      </div>
      <div class="header-right">
        <div class="package-card">
          <div class="pkg-label">Paket Aktif</div>
          <div class="pkg-name">{{ customer?.package_name }}</div>
          <div class="pkg-speed">{{ customer?.speed_up }} / {{ customer?.speed_down }}</div>
        </div>
      </div>
    </div>

    <div class="portal-grid">
      <!-- Left Column: Billing Info -->
      <div class="portal-main">
        <div class="card">
          <div class="card-header">
            <h3>Tagihan Anda</h3>
          </div>
          <div v-if="loading" class="loading-state" style="padding: 40px 0; text-align: center;">
            <span class="spinner" style="margin-bottom: 12px;"></span> 
            <p style="color: var(--text-muted); font-size: 14px;">Memuat tagihan...</p>
          </div>
          <div v-else-if="latestInvoice" class="invoice-status-card">
            <div v-if="latestInvoice.status === 'pending'" class="status-alert pending-alert">
              <div class="alert-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              </div>
              <div class="alert-text">
                <strong>Tagihan Belum Dibayar</strong>
                <p>Silakan lakukan pembayaran sebelum {{ formatDate(latestInvoice.due_date) }} untuk menghindari isolir.</p>
              </div>
            </div>
            <div v-else-if="latestInvoice.status === 'overdue'" class="status-alert overdue-alert">
              <div class="alert-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
              </div>
              <div class="alert-text">
                <strong>Tagihan Jatuh Tempo!</strong>
                <p>Layanan Anda mungkin akan diisolir. Segera lakukan pembayaran.</p>
              </div>
            </div>
            <div v-else-if="latestInvoice.status === 'paid'" class="status-alert paid-alert">
              <div class="alert-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
              <div class="alert-text">
                <strong>Layanan Aktif</strong>
                <p>Terima kasih! Tagihan bulan ini sudah lunas.</p>
              </div>
            </div>

            <div class="invoice-details">
              <div class="inv-row">
                <span>Nomor Invoice</span>
                <strong>{{ latestInvoice.invoice_number }}</strong>
              </div>
              <div class="inv-row">
                <span>Periode</span>
                <strong>{{ formatDate(latestInvoice.period_start, true) }} - {{ formatDate(latestInvoice.period_end, true) }}</strong>
              </div>
              <div class="inv-row total">
                <span>Total Bayar</span>
                <strong>{{ formatPrice(latestInvoice.amount) }}</strong>
              </div>
            </div>

            <div v-if="latestInvoice.status === 'pending' || latestInvoice.status === 'overdue'" class="payment-actions">
              <div v-if="paymentError" class="payment-error">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                <span>{{ paymentError }}</span>
              </div>
              <button class="btn btn-primary btn-block premium-btn" @click="payNow" :disabled="paying">
                <svg v-if="!paying" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>
                <span v-if="paying" class="spinner"></span>
                {{ paying ? 'Memproses Pembayaran...' : 'Bayar Sekarang via Xendit' }}
              </button>
              <p class="payment-note">Mendukung Transfer Bank, E-Wallet (OVO, Dana, ShopeePay), dan QRIS.</p>
            </div>
          </div>
          <div v-else class="empty-state">
            <p>Tidak ada tagihan aktif saat ini.</p>
          </div>
        </div>

        <div class="card mt-24">
          <div class="card-header">
            <h3>Riwayat Tagihan</h3>
          </div>
          <div class="table-container">
            <table class="portal-table">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Periode</th>
                  <th>Jumlah</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="inv in invoices" :key="inv.id">
                  <td>{{ inv.invoice_number }}</td>
                  <td>{{ formatDate(inv.period_start, true) }}</td>
                  <td>{{ formatPrice(inv.amount) }}</td>
                  <td><span class="badge" :class="inv.status">{{ inv.status.toUpperCase() }}</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Right Column: Account Info -->
      <div class="portal-side">
        <div class="card glass-card">
          <div class="card-header">
            <h3>Detail Akun</h3>
          </div>
          <div class="info-list">
            <div class="info-item">
              <label>Username PPPoE</label>
              <span>{{ customer?.pppoe_username }}</span>
            </div>
            <div class="info-item">
              <label>Nomor WhatsApp</label>
              <span>{{ customer?.phone }}</span>
            </div>
            <div class="info-item">
              <label>Alamat Pasang</label>
              <span>{{ customer?.address }}</span>
            </div>
            <div class="info-item">
              <label>Tanggal Join</label>
              <span>{{ formatDate(customer?.join_date) }}</span>
            </div>
          </div>
        </div>

        <div class="help-card">
          <div class="help-icon">?</div>
          <h4>Butuh Bantuan?</h4>
          <p>Hubungi admin kami jika ada kendala jaringan atau pembayaran.</p>
          <a :href="'https://wa.me/' + companyPhone" target="_blank" class="btn btn-secondary btn-block">
            Chat WhatsApp Admin
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { apiService } from '@/services/api';

export default {
  name: 'CustomerPortal',
  data() {
    return {
      customer: null,
      invoices: [],
      loading: true,
      paying: false,
      paymentError: '',
      companyPhone: '628123456789'
    };
  },
  computed: {
    latestInvoice() {
      return this.invoices.length > 0 ? this.invoices[0] : null;
    }
  },
  async mounted() {
    await this.loadData();
    await this.checkPaymentRedirect();
  },
  methods: {
    async checkPaymentRedirect() {
      const urlParams = new URLSearchParams(window.location.search);
      const paymentStatus = urlParams.get('payment');
      const invoiceNumber = urlParams.get('invoice');

      if (paymentStatus && invoiceNumber) {
        // Clean URL without reloading page
        window.history.replaceState({}, document.title, window.location.pathname);
        
        const invoice = this.invoices.find(i => i.invoice_number === invoiceNumber);
        if (invoice && invoice.status !== 'paid') {
          this.paying = true;
          this.paymentError = '';
          try {
            const res = await apiService.checkInvoiceStatus(invoice.id);
            if (res.success && res.status === 'paid') {
              alert('Pembayaran berhasil diverifikasi!');
              await this.loadData(); // Reload data to show "Lunas"
            } else if (paymentStatus === 'failed') {
              this.paymentError = 'Pembayaran dibatalkan atau gagal.';
            } else {
              this.paymentError = res.message || 'Pembayaran sedang diproses.';
            }
          } catch (err) {
            console.error('[Portal] Check status error:', err);
          } finally {
            this.paying = false;
          }
        }
      }
    },
    async loadData() {
      this.loading = true;
      try {
        const res = await apiService.getMe();
        if (res.success) {
          this.customer = res.customer;
          const resInv = await apiService.getInvoices({ customerId: this.customer.id, limit: 10 });
          if (resInv.success) {
            this.invoices = resInv.data;
          }
        }
      } catch (err) {
        console.error('Portal error:', err);
      } finally {
        this.loading = false;
      }
    },
    formatPrice(price) {
      return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);
    },
    formatDate(dateStr, short = false) {
      if (!dateStr) return '-';
      const options = short ? { month: 'short', year: 'numeric' } : { day: 'numeric', month: 'short', year: 'numeric' };
      return new Date(dateStr).toLocaleDateString('id-ID', options);
    },
    async payNow() {
      if (!this.latestInvoice) return;
      this.paying = true;
      this.paymentError = '';
      try {
        const res = await apiService.getPaymentLink(this.latestInvoice.id);
        if (res.success && res.url) {
          window.location.href = res.url;
        } else {
          this.paymentError = res.error || 'Gagal mendapatkan link pembayaran';
        }
      } catch (err) {
        const serverMsg = err.response?.data?.error || err.message || 'Koneksi ke server gagal';
        this.paymentError = serverMsg;
        console.error('[Portal] Payment error:', err);
      } finally {
        this.paying = false;
      }
    }
  }
};
</script>

<style scoped>
.customer-portal {
  display: flex;
  flex-direction: column;
  gap: 28px;
  max-width: 1100px;
  margin: 0 auto;
  width: 100%;
}

/* ===== HEADER ===== */
.portal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #4f46e5 0%, #0ea5e9 100%);
  padding: 36px 40px;
  border-radius: 24px;
  color: white;
  box-shadow: 0 10px 40px rgba(79, 70, 229, 0.25);
  position: relative;
  overflow: hidden;
  gap: 24px;
}

.portal-header::before {
  content: '';
  position: absolute;
  top: -60%;
  right: -15%;
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%);
  border-radius: 50%;
  pointer-events: none;
}

.header-left { position: relative; z-index: 1; }

.header-left h2 {
  font-size: 30px;
  font-weight: 800;
  margin-bottom: 12px;
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.header-left p {
  font-size: 14px;
  opacity: 0.9;
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-badge {
  font-size: 11px;
  font-weight: 700;
  padding: 5px 14px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.2);
  display: inline-flex;
  align-items: center;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.status-badge.active { background: rgba(34, 197, 94, 0.9); box-shadow: 0 2px 10px rgba(34, 197, 94, 0.4); }
.status-badge.suspended { background: rgba(239, 68, 68, 0.9); box-shadow: 0 2px 10px rgba(239, 68, 68, 0.4); }

.header-right { position: relative; z-index: 1; }

.package-card {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(16px);
  padding: 18px 28px;
  border-radius: 18px;
  text-align: right;
  border: 1px solid rgba(255, 255, 255, 0.25);
  min-width: 160px;
}

.pkg-label { font-size: 11px; font-weight: 600; opacity: 0.85; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.06em; }
.pkg-name { font-size: 20px; font-weight: 800; margin-bottom: 2px; }
.pkg-speed { font-size: 13px; opacity: 0.9; font-weight: 500; }

/* ===== GRID LAYOUT ===== */
.portal-grid {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 28px;
  align-items: start;
}

/* ===== CARDS ===== */
.card {
  background: var(--bg-card);
  border: 1px solid var(--border-card);
  border-radius: 20px;
  padding: 28px;
}

.glass-card {
  background: linear-gradient(145deg, var(--bg-card) 0%, rgba(255,255,255,0.02) 100%);
}

.card-header {
  margin-bottom: 24px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--border-subtle);
}

.card-header h3 {
  font-size: 17px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.01em;
  margin: 0;
}

/* ===== INVOICE STATUS ===== */
.invoice-status-card {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.status-alert {
  display: flex;
  gap: 16px;
  padding: 18px 20px;
  border-radius: 14px;
  align-items: center;
}

.pending-alert { background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.25); }
.pending-alert .alert-icon { background: #f59e0b; color: white; }
.pending-alert .alert-text strong { color: #d97706; }

.overdue-alert { background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.25); }
.overdue-alert .alert-icon { background: #ef4444; color: white; }
.overdue-alert .alert-text strong { color: #dc2626; }

.paid-alert { background: rgba(34, 197, 94, 0.08); border: 1px solid rgba(34, 197, 94, 0.25); }
.paid-alert .alert-icon { background: #22c55e; color: white; }
.paid-alert .alert-text strong { color: #15803d; }

.alert-icon {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.alert-text { flex: 1; min-width: 0; }
.alert-text strong { display: block; font-size: 15px; margin-bottom: 3px; font-weight: 700; }
.alert-text p { font-size: 13px; color: var(--text-secondary); margin: 0; line-height: 1.45; }

/* ===== INVOICE DETAILS ===== */
.invoice-details {
  background: var(--bg-input);
  padding: 22px;
  border-radius: 14px;
  border: 1px solid var(--border-subtle);
}

.inv-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  font-size: 14px;
}
.inv-row + .inv-row { border-top: 1px solid var(--border-subtle); }

.inv-row span { color: var(--text-muted); font-weight: 500; }
.inv-row strong { color: var(--text-primary); font-weight: 600; text-align: right; }

.inv-row.total {
  margin-top: 8px;
  padding-top: 14px;
  border-top: 2px dashed var(--border-subtle);
  font-size: 18px;
}
.inv-row.total strong { color: var(--accent-blue); font-weight: 800; }

/* ===== PAYMENT ===== */
.payment-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.payment-error {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.25);
  color: #ef4444;
  padding: 10px 16px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  width: 100%;
  text-align: left;
}
.payment-error svg { flex-shrink: 0; }

.premium-btn {
  padding: 14px 20px;
  font-size: 15px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border-radius: 14px;
  box-shadow: 0 4px 16px rgba(99, 102, 241, 0.3);
  transition: all 0.25s ease;
}
.premium-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(99, 102, 241, 0.4);
}

.payment-note {
  font-size: 12px;
  color: var(--text-muted);
  text-align: center;
}

.btn-block { width: 100%; }

/* ===== TABLE ===== */
.table-container { overflow-x: auto; }

.portal-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 400px;
}

.portal-table th {
  padding: 12px 16px;
  text-align: left;
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: var(--bg-input);
}
.portal-table th:first-child { border-radius: 10px 0 0 10px; }
.portal-table th:last-child { border-radius: 0 10px 10px 0; }
.portal-table td {
  padding: 14px 16px;
  border-bottom: 1px solid var(--border-subtle);
  font-size: 13px;
  color: var(--text-primary);
}
.portal-table tbody tr:last-child td { border-bottom: none; }

.badge {
  font-size: 10px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 20px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  display: inline-block;
}
.badge.paid { background: rgba(34,197,94,0.12); color: #16a34a; }
.badge.pending { background: rgba(245,158,11,0.12); color: #d97706; }
.badge.overdue { background: rgba(239,68,68,0.12); color: #dc2626; }
.badge.cancelled { background: rgba(100,116,139,0.12); color: #64748b; }

/* ===== ACCOUNT INFO ===== */
.info-list {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.info-item { display: flex; flex-direction: column; gap: 4px; }
.info-item label { font-size: 11px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; }
.info-item span { font-size: 15px; font-weight: 600; color: var(--text-primary); word-break: break-word; }

/* ===== HELP CARD ===== */
.help-card {
  margin-top: 24px;
  background: var(--bg-card);
  border: 1px solid var(--border-card);
  border-radius: 20px;
  padding: 28px 24px;
  text-align: center;
}

.help-icon {
  width: 52px;
  height: 52px;
  background: var(--bg-input);
  color: var(--accent-blue);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  font-size: 22px;
  font-weight: 800;
  border: 1px solid var(--border-subtle);
}

.help-card h4 { font-size: 16px; font-weight: 700; margin-bottom: 8px; color: var(--text-primary); }
.help-card p { font-size: 13px; color: var(--text-muted); margin-bottom: 20px; line-height: 1.5; }

/* ===== EMPTY / LOADING ===== */
.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: var(--text-muted);
  font-size: 14px;
  background: var(--bg-input);
  border-radius: 14px;
  border: 1px dashed var(--border-subtle);
}

.mt-24 { margin-top: 24px; }

/* ===== RESPONSIVE ===== */
@media (max-width: 900px) {
  .portal-grid { grid-template-columns: 1fr; }
}

@media (max-width: 640px) {
  .customer-portal { gap: 16px; }

  .portal-header {
    flex-direction: column;
    align-items: flex-start;
    padding: 24px;
    gap: 16px;
  }

  .header-left h2 { font-size: 24px; }

  .package-card {
    width: 100%;
    text-align: left;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 18px;
  }
  .package-card .pkg-label { display: none; }
  .package-card .pkg-name { font-size: 16px; }
  .package-card .pkg-speed { font-size: 12px; }

  .card { padding: 20px; border-radius: 16px; }
  .card-header { margin-bottom: 16px; padding-bottom: 12px; }
  .card-header h3 { font-size: 15px; }

  .status-alert { padding: 14px 16px; gap: 12px; }
  .alert-icon { width: 36px; height: 36px; }
  .alert-icon svg { width: 18px; height: 18px; }
  .alert-text strong { font-size: 14px; }
  .alert-text p { font-size: 12px; }

  .invoice-details { padding: 16px; }
  .inv-row { font-size: 13px; padding: 8px 0; }
  .inv-row.total { font-size: 16px; }

  .premium-btn { padding: 12px 16px; font-size: 14px; }
}
</style>
