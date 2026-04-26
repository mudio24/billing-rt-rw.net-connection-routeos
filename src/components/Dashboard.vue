<template>
  <div class="dashboard">
    <!-- Router Selector Toolbar -->
    <div class="toolbar no-print">
      <div class="toolbar-left" style="display: flex; gap: 15px; align-items: center;">
        <label for="router-select" style="font-size: 14px; font-weight: 600; color: var(--text-secondary);">Router:</label>
        <select 
          id="router-select" 
          v-model="selectedRouterId" 
          class="custom-select"
          @change="onRouterChange"
        >
          <option value="" disabled>--- Pilih Router Aktif ---</option>
          <option 
            v-for="r in onlineMikrotiks" 
            :key="r.id" 
            :value="r.id"
          >
            {{ r.name }} ({{ r.ip_address }})
          </option>
        </select>
        
        <label v-if="selectedRouterId" for="interface-select" style="font-size: 14px; font-weight: 600; color: var(--text-secondary); margin-left: 10px;">Interface:</label>
        <select 
          v-if="selectedRouterId"
          id="interface-select" 
          v-model="selectedInterface" 
          class="custom-select"
          @change="onInterfaceChange"
        >
          <option value="" disabled>--- Pilih Interface ---</option>
          <option 
            v-for="iface in interfaces" 
            :key="iface.name" 
            :value="iface.name"
          >
            {{ iface.name }}
          </option>
        </select>

        <div v-if="loading" class="spinner" style="margin-left: 10px;"></div>
      </div>
    </div>

    <!-- Error/No Selection State -->
    <div v-if="!selectedRouterId" class="empty-state">
      Silakan pilih router Mikrotik yang sedang aktif pada dropdown di atas untuk melihat Dashboard.
    </div>

    <div v-else class="dashboard-workspace">
      <!-- 4 Top Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon cpu-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="14" x2="23" y2="14"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="14" x2="4" y2="14"></line></svg>
          </div>
          <div class="stat-info">
            <div class="stat-title">CPU Load</div>
            <div class="stat-value">{{ resource.cpuLoad }}%</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon mem-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="12" x2="2" y2="12"></line><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path><line x1="6" y1="16" x2="6.01" y2="16"></line><line x1="10" y1="16" x2="10.01" y2="16"></line></svg>
          </div>
          <div class="stat-info">
            <div class="stat-title">Free Memory</div>
            <div class="stat-value">{{ resource.freeMemory }}</div>
            <div class="stat-subtitle">of {{ resource.totalMemory }}</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon time-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          </div>
          <div class="stat-info">
            <div class="stat-title">Uptime</div>
            <div class="stat-value" style="font-size: 16px;">{{ resource.uptime || '-' }}</div>
            <div class="stat-subtitle">{{ resource.version }}</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon user-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          </div>
          <div class="stat-info">
            <div class="stat-title">Active PPPoE</div>
            <div class="stat-value">{{ activePppoeCount }} <span style="font-size:12px; font-weight:normal;">Users</span></div>
          </div>
        </div>
      </div>

      <!-- Traffic Chart -->
      <div class="chart-container">
        <div class="chart-header">
          <h3>Realtime Traffic Monitoring 
            <span v-if="selectedInterface" class="badge-interface">{{ selectedInterface }}</span>
          </h3>
          <div class="legend">
            <div class="legend-item"><span class="color-box rx"></span> Rx (Download) : {{ currentRx }}</div>
            <div class="legend-item"><span class="color-box tx"></span> Tx (Upload) : {{ currentTx }}</div>
          </div>
        </div>
        <div class="chart-wrapper">
          <Line v-if="chartData.labels.length > 0" :data="chartData" :options="chartOptions" />
          <div v-else class="empty-chart">Memuat grafik...</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'vue-chartjs';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default {
  name: 'Dashboard',
  components: {
    Line
  },
  props: {
    mikrotiks: {
      type: Array,
      required: true
    }
  },
  data() {
    return {
      selectedRouterId: '',
      selectedInterface: '',
      loading: false,
      
      interfaces: [],
      
      resource: {
        cpuLoad: 0,
        freeMemory: '0 MB',
        totalMemory: '0 MB',
        uptime: '',
        version: ''
      },
      activePppoeCount: 0,
      
      currentRx: '0 bps',
      currentTx: '0 bps',
      
      // Chart Data
      maxDataPoints: 30, // Show last 30 data points (60 seconds if polled every 2s)
      rxDataRaw: [],
      txDataRaw: [],
      chartLabels: [],
      
      pollingInterval: null
    };
  },
  computed: {
    onlineMikrotiks() {
      return this.mikrotiks.filter(r => r.is_connected);
    },
    chartData() {
      return {
        labels: this.chartLabels,
        datasets: [
          {
            label: 'Rx (Download)',
            borderColor: '#5b4cf5',
            backgroundColor: 'rgba(91, 76, 245, 0.1)',
            borderWidth: 2,
            pointRadius: 0,
            fill: true,
            tension: 0.4,
            data: this.rxDataRaw
          },
          {
            label: 'Tx (Upload)',
            borderColor: '#a34cf5',
            backgroundColor: 'rgba(163, 76, 245, 0.1)',
            borderWidth: 2,
            pointRadius: 0,
            fill: true,
            tension: 0.4,
            data: this.txDataRaw
          }
        ]
      };
    },
    chartOptions() {
      return {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 0 // Disable animation for smoother realtime effect
        },
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            display: false // We use our custom HTML legend
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                let label = context.dataset.label || '';
                if (label) label += ': ';
                if (context.parsed.y !== null) {
                  label += this.formatBytes(context.parsed.y, true); // true = bits
                }
                return label;
              }
            }
          }
        },
        scales: {
          x: {
            display: true,
            grid: {
              color: 'rgba(255,255,255,0.05)'
            },
            ticks: {
              color: '#8b8e98',
              maxTicksLimit: 10
            }
          },
          y: {
            display: true,
            beginAtZero: true,
            grid: {
              color: 'rgba(255,255,255,0.05)'
            },
            ticks: {
              color: '#8b8e98',
              callback: (value) => {
                return this.formatBytes(value, true);
              }
            }
          }
        }
      };
    }
  },
  watch: {
    onlineMikrotiks(newVal) {
      if (this.selectedRouterId && !newVal.find(r => r.id === this.selectedRouterId)) {
        this.selectedRouterId = '';
        this.stopPolling();
      }
    }
  },
  beforeUnmount() {
    this.stopPolling();
  },
  methods: {
    formatBytes(bytes, isBits = false) {
      if (bytes === 0) return '0 ' + (isBits ? 'bps' : 'B');
      const k = 1024;
      const sizes = isBits ? ['bps', 'Kbps', 'Mbps', 'Gbps'] : ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    async onRouterChange() {
      this.stopPolling();
      this.interfaces = [];
      this.selectedInterface = '';
      this.resetChart();
      
      if (!this.selectedRouterId || !window.electronAPI) return;
      
      this.loading = true;
      try {
        // Fetch Initial Resources & Interfaces
        await this.fetchResourceData();
        const resIfaces = await window.electronAPI.getInterfaces(this.selectedRouterId);
        if (resIfaces.success) {
          this.interfaces = resIfaces.data.filter(i => i.type !== 'unknown');
          if (this.interfaces.length > 0) {
            // Auto select ether1 or the first one
            const ether = this.interfaces.find(i => i.name.includes('ether1') || i.name.includes('WAN'));
            this.selectedInterface = ether ? ether.name : this.interfaces[0].name;
          }
        }
        
        // Start Polling every 2 seconds
        this.startPolling();
      } catch (err) {
        console.error('Failed init router dashboard', err);
      } finally {
        this.loading = false;
      }
    },

    onInterfaceChange() {
      this.resetChart();
    },

    resetChart() {
      this.rxDataRaw = [];
      this.txDataRaw = [];
      this.chartLabels = [];
      this.currentRx = '0 bps';
      this.currentTx = '0 bps';
    },

    startPolling() {
      if (this.pollingInterval) clearInterval(this.pollingInterval);
      
      // Initial fetch
      this.fetchTrafficData();
      
      this.pollingInterval = setInterval(() => {
        this.fetchResourceData();
        this.fetchTrafficData();
      }, 2000);
    },

    stopPolling() {
      if (this.pollingInterval) {
        clearInterval(this.pollingInterval);
        this.pollingInterval = null;
      }
    },

    async fetchResourceData() {
      if (!this.selectedRouterId || !window.electronAPI) return;
      try {
        const res = await window.electronAPI.getSystemResource(this.selectedRouterId);
        if (res.success && res.data.length > 0) {
          const r = res.data[0];
          this.resource.cpuLoad = r['cpu-load'];
          this.resource.freeMemory = this.formatBytes(parseInt(r['free-memory']));
          this.resource.totalMemory = this.formatBytes(parseInt(r['total-memory']));
          this.resource.uptime = r.uptime;
          this.resource.version = `RouterOS v${r.version}`;
        }

        const pppRes = await window.electronAPI.getActivePppoe(this.selectedRouterId);
        if (pppRes.success) {
          this.activePppoeCount = pppRes.data.length;
        }
      } catch (err) {
        // ignore occasional timeout
      }
    },

    async fetchTrafficData() {
      if (!this.selectedRouterId || !this.selectedInterface || !window.electronAPI) return;
      try {
        const res = await window.electronAPI.getInterfaceTraffic(this.selectedRouterId, this.selectedInterface);
        if (res.success && res.data.length > 0) {
          const tr = res.data[0];
          const rxBits = parseInt(tr['rx-bits-per-second']);
          const txBits = parseInt(tr['tx-bits-per-second']);
          
          this.currentRx = this.formatBytes(rxBits, true);
          this.currentTx = this.formatBytes(txBits, true);

          const now = new Date();
          const timeStr = now.toLocaleTimeString('id-ID', { hour12: false });

          this.chartLabels.push(timeStr);
          this.rxDataRaw.push(rxBits);
          this.txDataRaw.push(txBits);

          // Keep array size fixed
          if (this.chartLabels.length > this.maxDataPoints) {
            this.chartLabels.shift();
            this.rxDataRaw.shift();
            this.txDataRaw.shift();
          }
        }
      } catch (err) {
        // ignore
      }
    }
  }
};
</script>

<style scoped>
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  background: var(--bg-card);
  border: 1px dashed var(--border-subtle);
  border-radius: var(--radius-lg);
  color: var(--text-muted);
}

.custom-select {
  padding: 8px 16px;
  border-radius: var(--radius-md);
  background: var(--bg-input);
  border: 1px solid var(--border-input);
  color: var(--text-primary);
  outline: none;
  font-family: inherit;
  min-width: 200px;
}

.dashboard-workspace {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Stats Cards */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.stat-card {
  background: var(--bg-card);
  border: 1px solid var(--border-card);
  border-radius: var(--radius-lg);
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.05);
  transition: transform var(--transition-fast);
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-icon svg {
  width: 24px;
  height: 24px;
}

.cpu-icon { background: rgba(91, 76, 245, 0.1); color: #5b4cf5; }
.mem-icon { background: rgba(34, 197, 94, 0.1); color: #22c55e; }
.time-icon { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
.user-icon { background: rgba(236, 72, 153, 0.1); color: #ec4899; }

.stat-info {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.stat-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.2;
}

.stat-subtitle {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Chart Area */
.chart-container {
  background: var(--bg-card);
  border: 1px solid var(--border-card);
  border-radius: var(--radius-lg);
  padding: 20px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.05);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.chart-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 10px;
}

.badge-interface {
  background: var(--bg-input);
  padding: 4px 10px;
  border-radius: var(--radius-full);
  font-size: 11px;
  font-family: monospace;
  color: var(--accent-blue);
  border: 1px solid var(--border-subtle);
}

.legend {
  display: flex;
  gap: 20px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
}

.color-box {
  width: 12px;
  height: 12px;
  border-radius: 3px;
}

.color-box.rx { background: #5b4cf5; }
.color-box.tx { background: #a34cf5; }

.chart-wrapper {
  position: relative;
  height: 350px;
  width: 100%;
}

.empty-chart {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-muted);
  font-size: 14px;
}
</style>
