<template>
  <div class="revenue-panel">
    <div class="panel-header">
      <div class="header-left">
        <h2>Pendapatan</h2>
        <p>Ringkasan keuangan berdasarkan data pembayaran invoice.</p>
      </div>
    </div>

    <!-- Filter Bar -->
    <div class="filter-bar">
      <div class="filter-group">
        <label>Dari</label>
        <input type="date" v-model="filters.from" @change="loadAll">
      </div>
      <div class="filter-group">
        <label>Sampai</label>
        <input type="date" v-model="filters.to" @change="loadAll">
      </div>
      <div class="filter-group">
        <label>Status</label>
        <select v-model="filters.status" @change="loadTransactions">
          <option value="">Semua</option>
          <option value="paid">Lunas</option>
          <option value="pending">Pending</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>
      <div class="filter-group">
        <label>Metode Bayar</label>
        <select v-model="filters.method" @change="loadTransactions">
          <option value="">Semua</option>
          <option value="manual">Cash</option>
          <option value="xendit">Xendit</option>
        </select>
      </div>
      <button class="btn-refresh" @click="loadAll" title="Refresh">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
      </button>
    </div>

    <!-- Summary Cards -->
    <div class="summary-cards" v-if="summary">
      <div class="summary-card card-revenue">
        <div class="card-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
        </div>
        <div class="card-body">
          <span class="card-label">Total Pendapatan</span>
          <span class="card-value">{{ formatCurrency(summary.paid.total) }}</span>
          <span class="card-sub">{{ summary.paid.count }} invoice lunas</span>
        </div>
      </div>
      <div class="summary-card card-today">
        <div class="card-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        </div>
        <div class="card-body">
          <span class="card-label">Pendapatan Hari Ini</span>
          <span class="card-value">{{ formatCurrency(summary.paidToday.total) }}</span>
          <span class="card-sub">{{ summary.paidToday.count }} transaksi</span>
        </div>
      </div>
      <div class="summary-card card-pending">
        <div class="card-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        </div>
        <div class="card-body">
          <span class="card-label">Piutang (Pending)</span>
          <span class="card-value">{{ formatCurrency(summary.pending.total) }}</span>
          <span class="card-sub">{{ summary.pending.count }} invoice menunggu</span>
        </div>
      </div>
      <div class="summary-card card-overdue">
        <div class="card-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        </div>
        <div class="card-body">
          <span class="card-label">Tunggakan (Overdue)</span>
          <span class="card-value">{{ formatCurrency(summary.overdue.total) }}</span>
          <span class="card-sub">{{ summary.overdue.count }} invoice tertunggak</span>
        </div>
      </div>
    </div>

    <!-- Charts Row -->
    <div class="charts-row">
      <!-- Daily Revenue Chart -->
      <div class="chart-card">
        <div class="chart-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
          Pendapatan Harian
        </div>
        <div class="chart-container">
          <canvas ref="dailyChart"></canvas>
        </div>
      </div>
      <!-- By Method Chart -->
      <div class="chart-card chart-small">
        <div class="chart-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>
          Metode Pembayaran
        </div>
        <div class="chart-container">
          <canvas ref="methodChart"></canvas>
        </div>
      </div>
    </div>

    <!-- Transactions Table -->
    <div class="table-card">
      <div class="table-header">
        <div class="chart-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
          Riwayat Transaksi
        </div>
        <div class="export-actions">
          <button class="btn-export" @click="exportCSV" title="Export ke Excel">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export Excel
          </button>
          <button class="btn-export btn-export-pdf" @click="printPDF" title="Cetak PDF">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
            Cetak PDF
          </button>
        </div>
      </div>
      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th>No. Invoice</th>
              <th>Pelanggan</th>
              <th>Paket</th>
              <th>Jumlah</th>
              <th>Status</th>
              <th>Metode</th>
              <th>Tgl Bayar</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="transactions.length === 0">
              <td colspan="7" style="text-align:center; color:var(--text-muted); padding:32px;">Belum ada transaksi pada rentang waktu ini.</td>
            </tr>
            <tr v-for="tx in transactions" :key="tx.id">
              <td><code>{{ tx.invoice_number }}</code></td>
              <td>{{ tx.customer_name }}</td>
              <td>{{ tx.package_name || '-' }}</td>
              <td class="amount">{{ formatCurrency(tx.amount) }}</td>
              <td>
                <span class="badge" :class="tx.status">{{ statusLabel(tx.status) }}</span>
              </td>
              <td>{{ methodLabel(tx.paid_via) }}</td>
              <td>{{ tx.paid_at ? formatDate(tx.paid_at) : '-' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
import { apiService } from '@/services/api';
import Chart from 'chart.js/auto';

export default {
  name: 'RevenueDashboard',
  data() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const from = `${y}-${m}-01`;
    const to = `${y}-${m}-${d}`;
    return {
      filters: { from, to, status: '', method: '' },
      summary: null,
      transactions: [],
      dailyChartInstance: null,
      methodChartInstance: null
    };
  },
  async mounted() {
    await this.loadAll();
  },
  beforeUnmount() {
    if (this.dailyChartInstance) this.dailyChartInstance.destroy();
    if (this.methodChartInstance) this.methodChartInstance.destroy();
  },
  methods: {
    async loadAll() {
      await Promise.all([
        this.loadSummary(),
        this.loadTransactions(),
        this.loadDailyChart(),
        this.loadMethodChart()
      ]);
    },
    async loadSummary() {
      try {
        const res = await apiService.getRevenueSummary(this.filters.from, this.filters.to);
        if (res.success) this.summary = res.data;
      } catch (err) { console.error('Revenue summary error:', err); }
    },
    async loadTransactions() {
      try {
        const params = { from: this.filters.from, to: this.filters.to };
        if (this.filters.status) params.status = this.filters.status;
        if (this.filters.method) params.method = this.filters.method;
        const res = await apiService.getRevenueTransactions(params);
        if (res.success) this.transactions = res.data;
      } catch (err) { console.error('Revenue transactions error:', err); }
    },
    async loadDailyChart() {
      try {
        const res = await apiService.getRevenueDaily(this.filters.from, this.filters.to);
        if (!res.success) return;

        const labels = res.data.map(r => {
          const d = new Date(r.date);
          return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
        });
        const values = res.data.map(r => Number(r.total));

        if (this.dailyChartInstance) this.dailyChartInstance.destroy();

        const ctx = this.$refs.dailyChart?.getContext('2d');
        if (!ctx) return;

        const gradient = ctx.createLinearGradient(0, 0, 0, 250);
        gradient.addColorStop(0, 'rgba(99, 102, 241, 0.4)');
        gradient.addColorStop(1, 'rgba(99, 102, 241, 0.02)');

        this.dailyChartInstance = new Chart(ctx, {
          type: 'bar',
          data: {
            labels,
            datasets: [{
              label: 'Pendapatan (Rp)',
              data: values,
              backgroundColor: gradient,
              borderColor: '#6366f1',
              borderWidth: 1.5,
              borderRadius: 6,
              barPercentage: 0.6
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: (ctx) => 'Rp ' + Number(ctx.raw).toLocaleString('id-ID')
                }
              }
            },
            scales: {
              x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 11 } } },
              y: {
                grid: { color: 'rgba(148, 163, 184, 0.08)' },
                ticks: {
                  color: '#94a3b8',
                  font: { size: 11 },
                  callback: (v) => v >= 1000000 ? (v / 1000000).toFixed(1) + 'jt' : v >= 1000 ? (v / 1000).toFixed(0) + 'rb' : v
                }
              }
            }
          }
        });
      } catch (err) { console.error('Daily chart error:', err); }
    },
    async loadMethodChart() {
      try {
        const res = await apiService.getRevenueByMethod(this.filters.from, this.filters.to);
        if (!res.success) return;

        const labels = res.data.map(r => this.methodLabel(r.method));
        const values = res.data.map(r => Number(r.total));
        const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

        if (this.methodChartInstance) this.methodChartInstance.destroy();

        const ctx = this.$refs.methodChart?.getContext('2d');
        if (!ctx) return;

        this.methodChartInstance = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels,
            datasets: [{
              data: values,
              backgroundColor: colors.slice(0, values.length),
              borderWidth: 0,
              hoverOffset: 8
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '65%',
            plugins: {
              legend: {
                position: 'bottom',
                labels: { color: '#94a3b8', padding: 12, font: { size: 11 } }
              },
              tooltip: {
                callbacks: {
                  label: (ctx) => ctx.label + ': Rp ' + Number(ctx.raw).toLocaleString('id-ID')
                }
              }
            }
          }
        });
      } catch (err) { console.error('Method chart error:', err); }
    },

    formatCurrency(val) {
      return 'Rp ' + Number(val || 0).toLocaleString('id-ID');
    },
    formatDate(d) {
      if (!d) return '-';
      return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    },
    statusLabel(s) {
      const map = { paid: 'Lunas', pending: 'Pending', overdue: 'Overdue', cancelled: 'Batal' };
      return map[s] || s;
    },
    methodLabel(m) {
      if (!m) return 'Lainnya';
      if (m.toLowerCase() === 'manual') return 'Cash';
      if (m.toLowerCase().includes('xendit')) return m; // Tetap tampilkan detail Xendit di tabel
      const map = { manual: 'Cash', xendit: 'Xendit', transfer: 'Transfer', cash: 'Cash', unknown: 'Lainnya' };
      return map[m] || m || 'Lainnya';
    },

    // ─── Export Excel ───
    exportCSV() {
      if (this.transactions.length === 0) {
        alert('Tidak ada data untuk di-export.');
        return;
      }

      const rows = this.transactions.map(tx => `
        <tr>
          <td>${tx.invoice_number || '-'}</td>
          <td>${tx.customer_name || '-'}</td>
          <td>${tx.package_name || '-'}</td>
          <td style="mso-number-format:'#,##0'">${tx.amount || 0}</td>
          <td>${this.statusLabel(tx.status)}</td>
          <td>${this.methodLabel(tx.paid_via)}</td>
          <td>${tx.paid_at ? new Date(tx.paid_at).toLocaleDateString('id-ID') : '-'}</td>
        </tr>
      `).join('');

      const html = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
        <head><meta charset="utf-8">
        <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>
        <x:Name>Pendapatan</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
        </x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
        </head>
        <body>
          <table border="1">
            <thead>
              <tr style="background:#111827; color:#fff; font-weight:bold;">
                <th>No. Invoice</th>
                <th>Pelanggan</th>
                <th>Paket</th>
                <th>Jumlah (Rp)</th>
                <th>Status</th>
                <th>Metode Bayar</th>
                <th>Tgl Bayar</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </body></html>
      `;

      const blob = new Blob(['\uFEFF' + html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `laporan-pendapatan_${this.filters.from}_${this.filters.to}.xls`;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    },

    // ─── Cetak PDF ───
    printPDF() {
      if (this.transactions.length === 0) {
        alert('Tidak ada data untuk dicetak.');
        return;
      }

      const summaryHTML = this.summary ? `
        <div style="display:flex; gap:24px; margin-bottom:24px; flex-wrap:wrap;">
          <div style="flex:1; min-width:140px; padding:12px; border:1px solid #ddd; border-radius:8px;">
            <div style="font-size:11px; color:#666; margin-bottom:4px;">TOTAL PENDAPATAN</div>
            <div style="font-size:18px; font-weight:800;">${this.formatCurrency(this.summary.paid.total)}</div>
            <div style="font-size:11px; color:#888;">${this.summary.paid.count} invoice lunas</div>
          </div>
          <div style="flex:1; min-width:140px; padding:12px; border:1px solid #ddd; border-radius:8px;">
            <div style="font-size:11px; color:#666; margin-bottom:4px;">PIUTANG (PENDING)</div>
            <div style="font-size:18px; font-weight:800; color:#d97706;">${this.formatCurrency(this.summary.pending.total)}</div>
            <div style="font-size:11px; color:#888;">${this.summary.pending.count} invoice</div>
          </div>
          <div style="flex:1; min-width:140px; padding:12px; border:1px solid #ddd; border-radius:8px;">
            <div style="font-size:11px; color:#666; margin-bottom:4px;">TUNGGAKAN (OVERDUE)</div>
            <div style="font-size:18px; font-weight:800; color:#dc2626;">${this.formatCurrency(this.summary.overdue.total)}</div>
            <div style="font-size:11px; color:#888;">${this.summary.overdue.count} invoice</div>
          </div>
        </div>
      ` : '';

      const tableRows = this.transactions.map(tx => `
        <tr>
          <td>${tx.invoice_number}</td>
          <td>${tx.customer_name}</td>
          <td>${tx.package_name || '-'}</td>
          <td style="text-align:right; font-weight:600;">${this.formatCurrency(tx.amount)}</td>
          <td>${this.statusLabel(tx.status)}</td>
          <td>${this.methodLabel(tx.paid_via)}</td>
          <td>${tx.paid_at ? new Date(tx.paid_at).toLocaleDateString('id-ID') : '-'}</td>
        </tr>
      `).join('');

      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Laporan Pendapatan</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 32px; color: #1a1a1a; font-size: 13px; }
            h1 { font-size: 20px; margin-bottom: 4px; }
            .subtitle { color: #666; margin-bottom: 24px; font-size: 13px; }
            table { width: 100%; border-collapse: collapse; margin-top: 8px; }
            th { text-align: left; padding: 8px 10px; font-size: 11px; text-transform: uppercase; color: #555; border-bottom: 2px solid #333; }
            td { padding: 7px 10px; border-bottom: 1px solid #e5e5e5; font-size: 12px; }
            tr:nth-child(even) { background: #f9f9f9; }
            @media print { body { padding: 16px; } }
          </style>
        </head>
        <body>
          <h1>Laporan Pendapatan</h1>
          <p class="subtitle">Periode: ${this.filters.from} s/d ${this.filters.to}</p>
          ${summaryHTML}
          <table>
            <thead>
              <tr>
                <th>No. Invoice</th>
                <th>Pelanggan</th>
                <th>Paket</th>
                <th style="text-align:right;">Jumlah</th>
                <th>Status</th>
                <th>Metode</th>
                <th>Tgl Bayar</th>
              </tr>
            </thead>
            <tbody>${tableRows}</tbody>
          </table>
          <script>window.onload = function() { window.print(); }<\/script>
        </body>
        </html>
      `);
      printWindow.document.close();
    }
  }
};
</script>

<style scoped>
.revenue-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.panel-header { display: flex; justify-content: space-between; align-items: center; }
.header-left h2 { font-size: 20px; font-weight: 700; color: var(--text-primary); margin-bottom: 4px; }
.header-left p { font-size: 13px; color: var(--text-muted); }

/* Filter Bar */
.filter-bar {
  display: flex;
  gap: 12px;
  align-items: flex-end;
  flex-wrap: wrap;
  padding: 16px 20px;
  background: var(--bg-card);
  border: 1px solid var(--border-card);
  border-radius: 16px;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.filter-group label {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.filter-group input,
.filter-group select {
  padding: 7px 12px;
  background: var(--bg-input);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 13px;
  min-width: 140px;
}

.filter-group input:focus,
.filter-group select:focus {
  border-color: #6366f1;
  outline: none;
}

.btn-refresh {
  padding: 8px;
  background: rgba(99, 102, 241, 0.1);
  border: 1px solid rgba(99, 102, 241, 0.2);
  border-radius: 8px;
  color: #a5b4fc;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}
.btn-refresh:hover {
  background: rgba(99, 102, 241, 0.2);
}

/* Summary Cards */
.summary-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

@media (max-width: 1100px) { .summary-cards { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 600px) { .summary-cards { grid-template-columns: 1fr; } }

.summary-card {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 20px;
  background: var(--bg-card);
  border: 1px solid var(--border-card);
  border-radius: 16px;
  transition: transform 0.2s, box-shadow 0.2s;
}

.summary-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.card-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.card-revenue .card-icon { background: rgba(99, 102, 241, 0.12); color: #a5b4fc; }
.card-today .card-icon { background: rgba(34, 197, 94, 0.12); color: #4ade80; }
.card-pending .card-icon { background: rgba(245, 158, 11, 0.12); color: #fbbf24; }
.card-overdue .card-icon { background: rgba(239, 68, 68, 0.12); color: #f87171; }

.card-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.card-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.card-value {
  font-size: 22px;
  font-weight: 800;
  color: var(--text-primary);
  letter-spacing: -0.5px;
}

.card-sub {
  font-size: 11px;
  color: var(--text-muted);
}

/* Charts */
.charts-row {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 16px;
}

@media (max-width: 900px) { .charts-row { grid-template-columns: 1fr; } }

.chart-card {
  background: var(--bg-card);
  border: 1px solid var(--border-card);
  border-radius: 16px;
  padding: 20px;
}

.chart-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 16px;
}

.chart-container {
  position: relative;
  height: 250px;
}

/* Table */
.table-card {
  background: var(--bg-card);
  border: 1px solid var(--border-card);
  border-radius: 16px;
  padding: 20px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.export-actions {
  display: flex;
  gap: 8px;
}

.btn-export {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: rgba(99, 102, 241, 0.1);
  border: 1px solid rgba(99, 102, 241, 0.2);
  border-radius: 8px;
  color: #a5b4fc;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-export:hover {
  background: rgba(99, 102, 241, 0.2);
}

.btn-export-pdf {
  background: rgba(239, 68, 68, 0.08);
  border-color: rgba(239, 68, 68, 0.2);
  color: #f87171;
}

.btn-export-pdf:hover {
  background: rgba(239, 68, 68, 0.15);
}

.table-scroll {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead th {
  text-align: left;
  padding: 10px 12px;
  font-size: 11px;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid var(--border-subtle);
}

tbody td {
  padding: 10px 12px;
  font-size: 13px;
  color: var(--text-secondary);
  border-bottom: 1px solid var(--border-subtle);
}

tbody tr:hover {
  background: var(--bg-glass);
}

td code {
  font-size: 12px;
  color: #a5b4fc;
  background: rgba(99, 102, 241, 0.08);
  padding: 2px 6px;
  border-radius: 4px;
}

td.amount {
  font-weight: 700;
  color: var(--text-primary);
  white-space: nowrap;
}

.badge {
  display: inline-block;
  font-size: 10px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 20px;
}

.badge.paid { background: rgba(34, 197, 94, 0.1); color: #22c55e; }
.badge.pending { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
.badge.overdue { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
.badge.cancelled { background: rgba(100, 116, 139, 0.1); color: #94a3b8; }
</style>
