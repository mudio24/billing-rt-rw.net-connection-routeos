<template>
  <div class="billing-dashboard">
    <!-- Summary Cards -->
    <div class="summary-grid">
      <div class="summary-card revenue">
        <div class="card-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
        </div>
        <div class="card-info">
          <div class="card-label">Total Pendapatan</div>
          <div class="card-value">{{ formattedRevenue }}</div>
          <div class="card-sub">Bulan ini</div>
        </div>
      </div>

      <div class="summary-card customers">
        <div class="card-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
        </div>
        <div class="card-info">
          <div class="card-label">Total Pelanggan</div>
          <div class="card-value">{{ stats.totalCustomers }}</div>
          <div class="card-sub">{{ stats.activeCustomers }} aktif</div>
        </div>
      </div>

      <div class="summary-card invoices">
        <div class="card-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
        </div>
        <div class="card-info">
          <div class="card-label">Invoice Belum Bayar</div>
          <div class="card-value">{{ stats.pendingInvoices }}</div>
          <div class="card-sub">Menunggu pembayaran</div>
        </div>
      </div>

      <div class="summary-card routers">
        <div class="card-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line></svg>
        </div>
        <div class="card-info">
          <div class="card-label">Router Online</div>
          <div class="card-value">{{ onlineRouters }}</div>
          <div class="card-sub">dari {{ totalRouters }} router</div>
        </div>
      </div>
    </div>

    <!-- Quick Actions & Recent Activity -->
    <div class="dashboard-panels">
      <div class="panel quick-actions">
        <div class="panel-header">
          <h3>Aksi Cepat</h3>
        </div>
        <div class="panel-body">
          <div class="action-grid">
            <button class="action-btn" @click="$emit('navigate', 'pppoe')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
              <span>Tambah Pelanggan</span>
            </button>
            <button class="action-btn" @click="$emit('navigate', 'invoice')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
              <span>Buat Invoice</span>
            </button>
            <button class="action-btn" @click="$emit('navigate', 'monitoring')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
              <span>Monitoring</span>
            </button>
            <button class="action-btn" @click="$emit('navigate', 'mikrotik')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect></svg>
              <span>Kelola Router</span>
            </button>
          </div>
        </div>
      </div>

      <div class="panel recent-activity">
        <div class="panel-header">
          <h3>Aktivitas Terbaru</h3>
        </div>
        <div class="panel-body">
          <div class="empty-activity">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.3"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            <p>Belum ada aktivitas</p>
            <span>Aktivitas billing akan muncul di sini</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { apiService } from '@/services/api';

export default {
  name: 'Dashboard',
  props: {
    mikrotiks: {
      type: Array,
      required: true
    }
  },
  data() {
    return {
      stats: {
        totalCustomers: 0,
        activeCustomers: 0,
        suspendedCustomers: 0,
        monthlyRevenue: 0,
        pendingInvoices: 0,
        overdueInvoices: 0
      }
    };
  },
  computed: {
    onlineRouters() {
      return this.mikrotiks.filter(r => r.is_connected).length;
    },
    totalRouters() {
      return this.mikrotiks.length;
    },
    formattedRevenue() {
      return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(this.stats.monthlyRevenue);
    }
  },
  async mounted() {
    await this.ensureAuth();
    await this.loadStats();
  },
  methods: {
    async ensureAuth() {
      // Auto-login admin if no token (temporary — will be replaced by login page)
      if (!localStorage.getItem('auth_token')) {
        const res = await apiService.login('admin', 'admin123');
        if (res.success) {
          localStorage.setItem('auth_token', res.token);
        }
      }
    },
    async loadStats() {
      try {
        const res = await apiService.getBillingDashboard();
        if (res.success) {
          this.stats = res.data;
        }
      } catch (err) {
        console.error('Failed to load billing stats:', err);
      }
    }
  }
};
</script>

<style scoped>
.billing-dashboard {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
}

.summary-card {
  background: var(--bg-card);
  border: 1px solid var(--border-card);
  border-radius: var(--radius-lg);
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.05);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.summary-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 30px rgba(0,0,0,0.12);
}

.card-icon {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.card-icon svg {
  width: 24px;
  height: 24px;
}

.revenue .card-icon { background: rgba(34, 197, 94, 0.12); color: #22c55e; }
.customers .card-icon { background: rgba(91, 76, 245, 0.12); color: #5b4cf5; }
.invoices .card-icon { background: rgba(245, 158, 11, 0.12); color: #f59e0b; }
.routers .card-icon { background: rgba(6, 182, 212, 0.12); color: #06b6d4; }

.card-info {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.card-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 4px;
}

.card-value {
  font-size: 26px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.2;
}

.card-sub {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 4px;
}

/* Panels */
.dashboard-panels {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

@media (max-width: 900px) {
  .dashboard-panels {
    grid-template-columns: 1fr;
  }
}

.panel {
  background: var(--bg-card);
  border: 1px solid var(--border-card);
  border-radius: var(--radius-lg);
  box-shadow: 0 4px 20px rgba(0,0,0,0.05);
  overflow: hidden;
}

.panel-header {
  padding: 18px 24px;
  border-bottom: 1px solid var(--border-subtle);
}

.panel-header h3 {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.panel-body {
  padding: 20px 24px;
}

/* Action Grid */
.action-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 20px 12px;
  background: var(--bg-input);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
  font-size: 12px;
  font-weight: 500;
}

.action-btn svg {
  width: 22px;
  height: 22px;
  color: var(--accent-blue);
}

.action-btn:hover {
  background: var(--bg-glass);
  border-color: var(--accent-blue);
  color: var(--text-primary);
  transform: translateY(-1px);
}

/* Empty Activity */
.empty-activity {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  color: var(--text-muted);
}

.empty-activity p {
  margin: 12px 0 4px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
}

.empty-activity span {
  font-size: 12px;
}
</style>
