<template>
  <div class="pppoe-management">
    <!-- Router Selector Toolbar -->
    <div class="toolbar">
      <div class="toolbar-left">
        <label for="router-select" style="font-size: 14px; font-weight: 600; color: var(--text-secondary);">Pilih Mikrotik:</label>
        <select 
          id="router-select" 
          v-model="selectedRouterId" 
          class="custom-select"
          @change="loadData"
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
        
        <button 
          class="btn btn-sm btn-secondary" 
          @click="loadData" 
          :disabled="!selectedRouterId || loading"
          title="Refresh Data"
        >
          ↻
        </button>
      </div>
      
      <div class="toolbar-right no-print">
        <button 
          v-if="selectedRouterId && currentSubTab === 'secrets'" 
          class="btn btn-sm btn-primary" 
          @click="openForm()"
        >
          + Tambah User PPPoE
        </button>
        <button 
          v-if="selectedRouterId && currentSubTab === 'profiles'" 
          class="btn btn-sm" style="background: #5b4cf5; color: white;" 
          @click="openProfileForm()"
        >
          + NEW PROFILE
        </button>
        <button 
          v-if="selectedRouterId && currentSubTab === 'secrets'" 
          class="btn btn-sm btn-secondary" 
          @click="printTable"
        >
          🖨️ Cetak
        </button>
      </div>
    </div>

    <!-- Error/No Selection State -->
    <div v-if="!selectedRouterId" class="empty-state">
      Silakan pilih router Mikrotik yang sedang aktif pada dropdown di atas untuk mengelola PPPoE.
    </div>

    <div v-else class="pppoe-workspace">
      <!-- Sub Tabs -->
      <div class="sub-tabs no-print">
        <div 
          class="sub-tab" 
          :class="{ active: currentSubTab === 'secrets' }" 
          @click="currentSubTab = 'secrets'"
        >
          <svg width="14" height="14" style="margin-right: 4px; vertical-align: middle;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
          ALL SECRETS
        </div>
        <div 
          class="sub-tab" 
          :class="{ active: currentSubTab === 'active' }" 
          @click="currentSubTab = 'active'"
        >
          <svg width="14" height="14" style="margin-right: 4px; vertical-align: middle;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
          ACTIVE CONNECTION
        </div>
        <div 
          class="sub-tab" 
          :class="{ active: currentSubTab === 'profiles' }" 
          @click="currentSubTab = 'profiles'"
        >
          <svg width="14" height="14" style="margin-right: 4px; vertical-align: middle;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
          SERVICE PROFILES
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <span class="spinner"></span> Memuat data dari Mikrotik...
      </div>

      <!-- Tab: Secrets (Users) -->
      <div v-else-if="currentSubTab === 'secrets'" class="tab-content printable-area">
        <h2 class="print-only">Daftar Pelanggan PPPoE - {{ selectedRouterName }}</h2>
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Username</th>
                <th class="no-print">Password</th>
                <th>Service</th>
                <th>Profile</th>
                <th>Komentar</th>
                <th>Status</th>
                <th class="no-print" style="text-align: right;">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="secrets.length === 0">
                <td colspan="7" class="text-center" style="padding: 30px;">Tidak ada user PPPoE ditemukan.</td>
              </tr>
              <tr v-for="secret in secrets" :key="secret['.id']" :class="{ disabled: secret.disabled === 'true' }">
                <td><strong>{{ secret.name }}</strong></td>
                <td class="no-print">
                  <span class="password-mask">{{ secret.password }}</span>
                </td>
                <td>{{ secret.service }}</td>
                <td>
                  <span class="badge badge-profile">{{ secret.profile }}</span>
                </td>
                <td class="text-muted">{{ secret.comment || '-' }}</td>
                <td>
                  <span v-if="secret.disabled === 'true'" class="badge badge-error">Nonaktif</span>
                  <span v-else class="badge badge-success">Aktif</span>
                </td>
                <td class="no-print" style="text-align: right;">
                  <button class="btn btn-ghost btn-sm" @click="openForm(secret)">Edit</button>
                  <button class="btn btn-ghost btn-sm" style="color: var(--status-offline);" @click="deleteSecret(secret['.id'], secret.name)">Hapus</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Tab: Active Monitor -->
      <div v-else-if="currentSubTab === 'active'" class="tab-content">
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>IP Address</th>
                <th>MAC Address (Caller ID)</th>
                <th>Uptime</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="activeUsers.length === 0">
                <td colspan="4" class="text-center" style="padding: 30px;">Belum ada koneksi PPPoE aktif saat ini.</td>
              </tr>
              <tr v-for="user in activeUsers" :key="user['.id']">
                <td>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span class="status-dot connected"></span>
                    <strong>{{ user.name }}</strong>
                  </div>
                </td>
                <td style="font-family: monospace;">{{ user.address }}</td>
                <td style="font-family: monospace;" class="text-muted">{{ user['caller-id'] }}</td>
                <td>{{ user.uptime }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <!-- Tab: Service Profiles -->
      <div v-else-if="currentSubTab === 'profiles'" class="tab-content">
        <div class="table-container" style="border-radius: var(--radius-md); overflow: hidden;">
          <table class="data-table">
            <thead style="background: var(--bg-secondary);">
              <tr>
                <th style="color: var(--text-muted); font-size: 11px; text-transform: uppercase;">PROFILE NAME</th>
                <th style="color: var(--text-muted); font-size: 11px; text-transform: uppercase;">RATE LIMIT</th>
                <th style="color: var(--text-muted); font-size: 11px; text-transform: uppercase;">PRICE (BILLING)</th>
                <th style="color: var(--text-muted); font-size: 11px; text-transform: uppercase; text-align: right;">ACTION</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="profiles.length === 0">
                <td colspan="4" class="text-center" style="padding: 30px;">Belum ada Service Profile.</td>
              </tr>
              <tr v-for="prof in profiles" :key="prof['.id']">
                <td><strong>{{ prof.name }}</strong></td>
                <td style="font-family: monospace;">{{ prof['rate-limit'] || 'Unlimited' }}</td>
                <td style="font-weight: 600; color: var(--accent-blue);">
                  Rp {{ prof.price ? prof.price.toLocaleString() : '0' }}
                </td>
                <td style="text-align: right;">
                  <button class="btn btn-ghost btn-sm" @click="openProfileForm(prof)">Edit</button>
                  <button class="btn btn-ghost btn-sm" style="color: var(--status-offline);" @click="deleteProfile(prof['.id'], prof.name)">Hapus</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- PPPoE Secret Form Modal -->
    <PPPoEForm
      v-if="showForm"
      :secret="editingSecret"
      :is-editing="isEditing"
      :profiles="profiles"
      @save="saveSecret"
      @cancel="showForm = false"
    />
    <PPPoEProfileForm
      v-if="showProfileForm"
      :profile="editingProfile"
      :is-editing="isProfileEditing"
      :ip-pools="ipPools"
      @save="saveProfile"
      @cancel="showProfileForm = false"
    />
  </div>
</template>

<script>
import PPPoEForm from './PPPoEForm.vue';
import PPPoEProfileForm from './PPPoEProfileForm.vue';

export default {
  name: 'PPPoEManagement',
  components: {
    PPPoEForm,
    PPPoEProfileForm
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
      currentSubTab: 'secrets',
      loading: false,
      secrets: [],
      activeUsers: [],
      profiles: [],
      ipPools: [],
      
      showForm: false,
      isEditing: false,
      editingSecret: null,

      showProfileForm: false,
      isProfileEditing: false,
      editingProfile: null
    };
  },
  computed: {
    onlineMikrotiks() {
      return this.mikrotiks.filter(r => r.is_connected);
    },
    selectedRouterName() {
      const r = this.mikrotiks.find(r => r.id === this.selectedRouterId);
      return r ? r.name : 'Unknown';
    }
  },
  watch: {
    // If current selected router goes offline, reset selection
    onlineMikrotiks(newVal) {
      if (this.selectedRouterId && !newVal.find(r => r.id === this.selectedRouterId)) {
        this.selectedRouterId = '';
        this.secrets = [];
        this.activeUsers = [];
      }
    },
    currentSubTab() {
      if (this.selectedRouterId) {
        this.loadData();
      }
    }
  },
  methods: {
    async loadData() {
      if (!this.selectedRouterId || !window.electronAPI) return;
      
      this.loading = true;
      try {
        if (this.currentSubTab === 'secrets') {
          const secRes = await window.electronAPI.getPppoeSecrets(this.selectedRouterId);
          if (secRes.success) this.secrets = secRes.data;
          
          const profRes = await window.electronAPI.getPppoeProfiles(this.selectedRouterId);
          if (profRes.success) this.profiles = profRes.data;
        } else if (this.currentSubTab === 'active') {
          const actRes = await window.electronAPI.getActivePppoe(this.selectedRouterId);
          if (actRes.success) this.activeUsers = actRes.data;
        } else if (this.currentSubTab === 'profiles') {
          const profRes = await window.electronAPI.getPppoeProfiles(this.selectedRouterId);
          if (profRes.success) this.profiles = profRes.data;
          
          const poolRes = await window.electronAPI.getIpPools(this.selectedRouterId);
          if (poolRes.success) this.ipPools = poolRes.data.map(p => p.name);
        }
      } catch (err) {
        console.error('Failed to load PPPoE data:', err);
        this.$emit('add-toast', 'error', 'Gagal membacara data dari Mikrotik');
      } finally {
        this.loading = false;
      }
    },

    openForm(secret = null) {
      if (secret) {
        this.editingSecret = { ...secret };
        this.isEditing = true;
      } else {
        this.editingSecret = null;
        this.isEditing = false;
      }
      this.showForm = true;
    },

    async saveSecret(data) {
      if (!window.electronAPI) return;
      
      try {
        let res;
        if (this.isEditing) {
          res = await window.electronAPI.updatePppoeSecret(this.selectedRouterId, this.editingSecret['.id'], data);
        } else {
          res = await window.electronAPI.addPppoeSecret(this.selectedRouterId, data);
        }

        if (res.success) {
          this.$emit('add-toast', 'success', `User PPPoE ${data.name} berhasil disimpan`);
          this.showForm = false;
          this.loadData();
        } else {
          this.$emit('add-toast', 'error', res.error || 'Gagal menyimpan user');
        }
      } catch (err) {
        console.error('Save error:', err);
        this.$emit('add-toast', 'error', 'Terjadi kesalahan sistem');
      }
    },

    async deleteSecret(id, name) {
      if (!confirm(`Apakah Anda yakin ingin menghapus user ${name}?`)) return;
      
      try {
        const res = await window.electronAPI.deletePppoeSecret(this.selectedRouterId, id);
        if (res.success) {
          this.$emit('add-toast', 'success', `User ${name} berhasil dihapus`);
          this.loadData();
        } else {
          this.$emit('add-toast', 'error', res.error || 'Gagal menghapus user');
        }
      } catch (err) {
        console.error('Delete error:', err);
      }
    },

    openProfileForm(profile = null) {
      if (profile) {
        this.editingProfile = { ...profile };
        this.isProfileEditing = true;
      } else {
        this.editingProfile = null;
        this.isProfileEditing = false;
      }
      this.showProfileForm = true;
    },

    async saveProfile(data) {
      if (!window.electronAPI) return;
      this.loading = true;
      try {
        let res;
        if (this.isProfileEditing) {
          res = await window.electronAPI.updatePppoeProfile(this.selectedRouterId, this.editingProfile['.id'], data);
        } else {
          res = await window.electronAPI.addPppoeProfile(this.selectedRouterId, data);
        }

        if (res.success) {
          this.$emit('add-toast', 'success', `Profile PPPoE ${data.name} berhasil disimpan`);
          this.showProfileForm = false;
          this.loadData();
        } else {
          this.$emit('add-toast', 'error', res.error || 'Gagal menyimpan profile');
        }
      } catch (err) {
        console.error('Save Profile error:', err);
      } finally {
        this.loading = false;
      }
    },

    async deleteProfile(id, name) {
      if (!confirm(`Hapus profile ${name}? Pastikan tidak ada user/secret yang masih menggunakannya!`)) return;
      try {
        const res = await window.electronAPI.deletePppoeProfile(this.selectedRouterId, id);
        if (res.success) {
          this.$emit('add-toast', 'success', `Profile ${name} dihapus`);
          this.loadData();
        } else {
          this.$emit('add-toast', 'error', res.error || 'Gagal menghapus profile');
        }
      } catch (err) {
        console.error('Delete Profile error:', err);
      }
    },

    printTable() {
      window.print();
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
  min-width: 240px;
  margin-left: 10px;
}

.sub-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  border-bottom: 1px solid var(--border-subtle);
  padding-bottom: 4px;
}

.sub-tab {
  padding: 8px 16px;
  cursor: pointer;
  color: var(--text-muted);
  font-weight: 500;
  border-bottom: 2px solid transparent;
  transition: all var(--transition-fast);
}

.sub-tab:hover {
  color: var(--text-primary);
}

.sub-tab.active {
  color: var(--accent-blue);
  border-bottom-color: var(--accent-blue);
}

.table-container {
  overflow-x: auto;
  background: var(--bg-card);
  border: 1px solid var(--border-card);
  border-radius: var(--radius-lg);
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th, .data-table td {
  padding: 14px 20px;
  text-align: left;
  border-bottom: 1px solid var(--border-subtle);
}

.data-table th {
  font-weight: 600;
  color: var(--text-secondary);
  font-size: 13px;
  background: var(--bg-glass);
}

.data-table td {
  font-size: 14px;
  color: var(--text-primary);
}

.data-table tr:last-child td {
  border-bottom: none;
}

.data-table tbody tr {
  transition: background var(--transition-fast);
}

.data-table tbody tr:hover {
  background: var(--bg-glass-hover);
}

.data-table tr.disabled td {
  opacity: 0.6;
}

.badge {
  padding: 4px 10px;
  border-radius: var(--radius-full);
  font-size: 11px;
  font-weight: 600;
}

.badge-profile {
  background: var(--bg-glass);
  color: var(--text-accent);
  border: 1px solid var(--border-subtle);
}

.badge-success {
  background: var(--status-connected-bg);
  color: var(--status-connected);
}

.badge-error {
  background: var(--status-offline-bg);
  color: var(--status-offline);
}

.password-mask {
  font-family: monospace;
  background: var(--bg-input);
  padding: 2px 6px;
  border-radius: 4px;
}

.print-only {
  display: none;
}

/* === Print Standardizer === */
@media print {
  /* Hide unnecessary UI elements when printing */
  .no-print, .sidebar, .app-header {
    display: none !important;
  }
  
  .print-only {
    display: block !important;
    font-size: 20px;
    font-weight: bold;
    margin-bottom: 15px;
    color: #000;
  }

  /* Reset layout to full width */
  .content-wrapper, .main-content, .pppoe-management {
    padding: 0 !important;
    margin: 0 !important;
    background: white !important;
    height: auto !important;
    overflow: visible !important;
  }
  
  body, html, #app, .app-container {
    height: auto !important;
    background: white !important;
    color: black !important;
  }

  /* Optimize table for print */
  .table-container {
    border: none;
    box-shadow: none;
  }
  
  .data-table {
    border-collapse: collapse;
    width: 100%;
  }
  
  .data-table th, .data-table td {
    border: 1px solid #ccc !important;
    padding: 8px !important;
    color: black !important;
  }
  
  .data-table th {
    background: #f0f0f0 !important;
    -webkit-print-color-adjust: exact;
  }
  
  @page {
    margin: 1cm;
  }
}
</style>
