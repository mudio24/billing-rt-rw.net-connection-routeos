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
      
      <div class="sidebar-menu">
        <div class="sidebar-item active">
          <span>Mikrotik</span>
        </div>
        <div class="sidebar-item">
          <span>Vouchers</span>
        </div>
        <div class="sidebar-item">
          <span>PPPoE Users</span>
        </div>
        <div class="sidebar-item">
          <span>Settings</span>
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
          <div class="toolbar-title">Mikrotik Management List</div>
        </div>
        <div class="header-actions" style="display: flex; gap: 16px; align-items: center;">
          <button class="btn btn-sm btn-ghost" @click="toggleTheme">
            {{ isLightMode ? 'Dark Mode' : 'Light Mode' }}
          </button>
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

export default {
  name: 'App',
  components: {
    RouterManagement,
    RouterForm
  },
  data() {
    return {
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
