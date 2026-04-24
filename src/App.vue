<template>
  <div class="app-container">
    <!-- Toast Notifications -->
    <div class="toast-container" v-if="toasts.length">
      <!-- Removed Emoji from Toast icon, using CSS or text instead -->
      <div
        v-for="toast in toasts"
        :key="toast.id"
        :class="['toast', toast.type]"
      >
        <span class="toast-indicator" :class="toast.type"></span>
        <span>{{ toast.message }}</span>
        <button class="toast-close" @click="removeToast(toast.id)">✕</button>
      </div>
    </div>

    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="sidebar-logo">MN</div>
        <div class="sidebar-brand">
          <div class="sidebar-title">Mikrotik Manager</div>
          <div class="sidebar-subtitle">By Antigravity</div>
        </div>
      </div>
      
      <div class="sidebar-menu" style="overflow-y: auto;">
        <!-- RINGKASAN UTAMA -->
        <div class="sidebar-section-title">
          <span>RINGKASAN UTAMA</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </div>
        <div class="sidebar-item" :class="{ active: activeTab === 'dashboard' }" @click="activeTab = 'dashboard'">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
          <span>Dashboard</span>
        </div>
        <div class="sidebar-item" :class="{ active: activeTab === 'monitoring' }" @click="activeTab = 'monitoring'">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
          <span>Realtime Monitoring</span>
        </div>
        <div class="sidebar-item" :class="{ active: activeTab === 'map' }" @click="activeTab = 'map'">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"></polygon><line x1="9" y1="3" x2="9" y2="18"></line><line x1="15" y1="6" x2="15" y2="21"></line></svg>
          <span>Peta Jaringan</span>
        </div>

        <!-- CRM & DUKUNGAN -->
        <div class="sidebar-section-title" style="margin-top: 12px;">
          <span>CRM & DUKUNGAN</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </div>
        <div class="sidebar-item" :class="{ active: activeTab === 'invoice' }" @click="activeTab = 'invoice'">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
          <span>Invoice Tagihan</span>
        </div>
        <div class="sidebar-item" :class="{ active: activeTab === 'packages' }" @click="activeTab = 'packages'">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
          <span>Paket Internet</span>
        </div>
        <div class="sidebar-item" :class="{ active: activeTab === 'vouchers' }" @click="activeTab = 'vouchers'">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2" ry="2"></rect><line x1="8" y1="6" x2="8" y2="18"></line><line x1="16" y1="6" x2="16" y2="18"></line></svg>
          <span>Voucher Hotspot</span>
        </div>

        <!-- LAYANAN JARINGAN -->
        <div class="sidebar-section-title" style="margin-top: 12px;">
          <span>LAYANAN JARINGAN</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </div>
        <div class="sidebar-item" :class="{ active: activeTab === 'mikrotik' }" @click="activeTab = 'mikrotik'">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="14" x2="23" y2="14"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="14" x2="4" y2="14"></line></svg>
          <span>Mikrotik Router</span>
        </div>
        <div class="sidebar-item" :class="{ active: activeTab === 'pppoe' }" @click="activeTab = 'pppoe'">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20"></path><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
          <span>PPPoE Management</span>
        </div>
        <div class="sidebar-item" :class="{ active: activeTab === 'hotspot' }" @click="activeTab = 'hotspot'">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"></path><path d="M1.42 9a16 16 0 0 1 21.16 0"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><line x1="12" y1="20" x2="12.01" y2="20"></line></svg>
          <span>Hotspot Management</span>
        </div>
        <div class="sidebar-item" :class="{ active: activeTab === 'queue' }" @click="activeTab = 'queue'">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
          <span>Queue Management</span>
        </div>
      </div>

      <div class="sidebar-footer">
        <div class="sidebar-user" style="display: flex; align-items: center; gap: 10px;">
          <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--bg-glass); display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: bold; color: var(--accent-blue);">A</div>
          <div style="display: flex; flex-direction: column;">
            <span style="font-size: 13px; font-weight: 600; color: var(--text-primary);">Administrator</span>
            <span style="font-size: 11px; color: var(--text-muted);">Admin</span>
          </div>
        </div>
      </div>
    </aside>

    <!-- Main Content Wrapper -->
    <div class="content-wrapper">
      <!-- Header -->
      <header class="app-header">
        <div class="app-header-left">
          <div class="toolbar-title">{{ activeTab === 'mikrotik' ? 'Mikrotik Management List' : 'PPPoE Users Management' }}</div>
        </div>
        <div class="header-actions" style="display: flex; gap: 20px; align-items: center;">
          <div class="theme-toggle-wrapper" style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 12px; color: var(--text-muted); font-weight: 500;">Dark</span>
            <label class="theme-switch" title="Toggle Theme">
              <input type="checkbox" :checked="isLightMode" @change="toggleTheme">
              <span class="theme-slider"></span>
            </label>
            <span style="font-size: 12px; color: var(--text-muted); font-weight: 500;">Light</span>
          </div>
          <div class="header-stats">
            <div class="header-stat">
              <span class="stat-dot connected"></span>
              <span>{{ connectedCount }} Online</span>
            </div>
            <div class="header-stat">
              <span class="stat-dot offline"></span>
              <span>{{ offlineCount }} Offline</span>
            </div>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="main-content">
        <RouterManagement
          v-if="activeTab === 'mikrotik'"
          :mikrotiks="mikrotiks"
          :loading-mikrotiks="loadingMikrotiks"
          @add-mikrotik="openAddForm"
          @edit-mikrotik="openEditForm"
          @delete-mikrotik="confirmDelete"
          @connect-mikrotik="connectMikrotik"
          @disconnect-mikrotik="disconnectMikrotik"
          @search="handleSearch"
          @copy-ip="copyIp"
        />

        <PPPoEManagement
          v-if="activeTab === 'pppoe'"
          :mikrotiks="mikrotiks"
          @add-toast="addToast"
        />
      </main>
    </div>

    <!-- Mikrotik Form Modal -->
    <RouterForm
      v-if="showForm"
      :mikrotik="editingMikrotik"
      :is-editing="isEditing"
      :test-connection-fn="testConnection"
      @save="saveMikrotik"
      @cancel="closeForm"
    />

    <!-- Confirm Delete Dialog -->
    <div class="modal-overlay" v-if="showConfirm" @click.self="showConfirm = false">
      <div class="modal-content" style="max-width: 420px;">
        <div class="confirm-dialog">
          <div class="confirm-title" style="color: var(--status-offline); margin-bottom: 8px;">Hapus Mikrotik?</div>
          <div class="confirm-message">
            Apakah kamu yakin ingin menghapus mikrotik
            <strong>{{ deletingMikrotik?.name }}</strong>?
            Mikrotik akan dinonaktifkan dan tidak tampil di daftar.
          </div>
          <div class="confirm-actions">
            <button class="btn btn-secondary" @click="showConfirm = false">Batal</button>
            <button class="btn btn-danger" @click="deleteMikrotik" :disabled="isDeleting">
              <span v-if="isDeleting" class="spinner"></span>
              {{ isDeleting ? 'Menghapus...' : 'Ya, Hapus' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import RouterManagement from './components/RouterManagement.vue';
import RouterForm from './components/RouterForm.vue';
import PPPoEManagement from './components/PPPoEManagement.vue';

export default {
  name: 'App',
  components: {
    RouterManagement,
    RouterForm,
    PPPoEManagement
  },
  data() {
    return {
      activeTab: 'mikrotik',
      mikrotiks: [],
      filteredMikrotiks: [],
      loadingMikrotiks: new Set(),
      showForm: false,
      isEditing: false,
      editingMikrotik: null,
      showConfirm: false,
      deletingMikrotik: null,
      isDeleting: false,
      toasts: [],
      toastId: 0,
      searchQuery: '',
      isLightMode: false
    };
  },
  computed: {
    connectedCount() {
      return this.mikrotiks.filter(r => r.is_connected).length;
    },
    offlineCount() {
      return this.mikrotiks.filter(r => !r.is_connected).length;
    }
  },
  async mounted() {
    // Initialize Theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      this.isLightMode = true;
      document.documentElement.setAttribute('data-theme', 'light');
    }

    await this.loadMikrotiks();

    // Listen for auto-connect results from Electron main process
    if (window.electronAPI?.onAutoConnectResult) {
      window.electronAPI.onAutoConnectResult((results) => {
        results.forEach(r => {
          this.addToast(
            r.success ? 'success' : 'error',
            `${r.name}: ${r.message}`
          );
        });
        this.loadMikrotiks();
      });
    }

    // Listen for connection updates
    if (window.electronAPI?.onConnectionUpdate) {
      window.electronAPI.onConnectionUpdate(() => {
        this.loadMikrotiks();
      });
    }
  },
  methods: {
    // ==================
    // Theme Toggle
    // ==================
    toggleTheme() {
      this.isLightMode = !this.isLightMode;
      if (this.isLightMode) {
        document.documentElement.setAttribute('data-theme', 'light');
        localStorage.setItem('theme', 'light');
      } else {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('theme', 'dark');
      }
    },

    // ==================
    // Data Loading
    // ==================
    async loadMikrotiks() {
      try {
        if (window.electronAPI) {
          const data = await window.electronAPI.getMikrotiks();
          this.mikrotiks = data || [];
        }
      } catch (err) {
        console.error('Failed to load mikrotiks:', err);
        this.addToast('error', 'Gagal memuat data mikrotik');
      }
    },



    // ==================
    // Form Handlers
    // ==================
    openAddForm() {
      this.editingMikrotik = null;
      this.isEditing = false;
      this.showForm = true;
    },

    openEditForm(mikrotik) {
      this.editingMikrotik = { ...mikrotik };
      this.isEditing = true;
      this.showForm = true;
    },

    closeForm() {
      this.showForm = false;
      this.editingMikrotik = null;
      this.isEditing = false;
    },

    async saveMikrotik(data) {
      try {
        if (!window.electronAPI) return;

        let result;
        if (this.isEditing) {
          result = await window.electronAPI.updateMikrotik(this.editingMikrotik.id, data);
          if (result.success) {
            this.addToast('success', `Mikrotik "${data.name}" berhasil diperbarui`);
          } else {
            this.addToast('error', result.error || 'Gagal update mikrotik');
            return;
          }
        } else {
          result = await window.electronAPI.addMikrotik(data);
          if (result.success) {
            this.addToast('success', `Mikrotik "${data.name}" berhasil ditambahkan`);
          } else {
            this.addToast('error', result.error || 'Gagal menambah mikrotik');
            return;
          }
        }
        this.closeForm();
        await this.loadMikrotiks();
      } catch (err) {
        console.error('Save mikrotik error:', err);
        this.addToast('error', 'Terjadi kesalahan saat menyimpan mikrotik');
      }
    },

    // ==================
    // Delete
    // ==================
    confirmDelete(mikrotik) {
      this.deletingMikrotik = mikrotik;
      this.showConfirm = true;
    },

    async deleteMikrotik() {
      if (!this.deletingMikrotik || !window.electronAPI) return;
      this.isDeleting = true;

      try {
        const result = await window.electronAPI.deleteMikrotik(this.deletingMikrotik.id);

        if (result.success) {
          this.addToast('success', `Mikrotik "${this.deletingMikrotik.name}" berhasil dihapus`);
          await this.loadMikrotiks();
        } else {
          this.addToast('error', result.error || 'Gagal menghapus mikrotik');
        }
      } catch (err) {
        console.error('Delete mikrotik error:', err);
        this.addToast('error', 'Terjadi kesalahan saat menghapus mikrotik');
      } finally {
        this.isDeleting = false;
        this.showConfirm = false;
        this.deletingMikrotik = null;
      }
    },

    // ==================
    // Connectivity
    // ==================
    async connectMikrotik(mikrotik) {
      if (!window.electronAPI) return;
      this.loadingMikrotiks.add(mikrotik.id);
      this.loadingMikrotiks = new Set(this.loadingMikrotiks);

      try {
        const result = await window.electronAPI.connectMikrotik(mikrotik.id);
        this.addToast(result.success ? 'success' : 'error', result.message);
        await this.loadMikrotiks();
      } catch (err) {
        console.error('Connect error:', err);
        this.addToast('error', 'Gagal terkoneksi ke mikrotik');
      } finally {
        this.loadingMikrotiks.delete(mikrotik.id);
        this.loadingMikrotiks = new Set(this.loadingMikrotiks);
      }
    },

    async disconnectMikrotik(mikrotik) {
      if (!window.electronAPI) return;
      this.loadingMikrotiks.add(mikrotik.id);
      this.loadingMikrotiks = new Set(this.loadingMikrotiks);

      try {
        const result = await window.electronAPI.disconnectMikrotik(mikrotik.id);
        this.addToast(result.success ? 'success' : 'error', result.message);
        await this.loadMikrotiks();
      } catch (err) {
        console.error('Disconnect error:', err);
        this.addToast('error', 'Gagal disconnect dari mikrotik');
      } finally {
        this.loadingMikrotiks.delete(mikrotik.id);
        this.loadingMikrotiks = new Set(this.loadingMikrotiks);
      }
    },

    async testConnection(data) {
      try {
        if (window.electronAPI) {
          return await window.electronAPI.testConnection(data);
        }
        return { success: false, message: 'Electron API tidak tersedia' };
      } catch (err) {
        console.error('Test connection error:', err);
        return { success: false, message: 'Gagal test koneksi' };
      }
    },

    // ==================
    // Search
    // ==================
    handleSearch(query) {
      this.searchQuery = query;
    },

    // ==================
    // Copy IP
    // ==================
    async copyIp(ip) {
      try {
        await navigator.clipboard.writeText(ip);
        this.addToast('success', `IP ${ip} disalin ke clipboard`);
      } catch {
        this.addToast('error', 'Gagal menyalin IP');
      }
    },

    // ==================
    // Toast Notifications
    // ==================
    addToast(type, message) {
      const id = ++this.toastId;
      this.toasts.push({ id, type, message });
      setTimeout(() => this.removeToast(id), 4000);
    },

    removeToast(id) {
      this.toasts = this.toasts.filter(t => t.id !== id);
    }
  }
};
</script>
