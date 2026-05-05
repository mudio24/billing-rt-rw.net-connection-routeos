<template>
  <div class="app-container">
    <!-- Login Page -->
    <Login v-if="!isLoggedIn" @login-success="handleLoginSuccess" />

    <!-- Customer Portal (Special view for pelanggan) -->
    <template v-else-if="currentUser.role === 'pelanggan'">
      <div class="app-container customer-view">
        <header class="portal-nav">
          <div class="logo">MN</div>
          <div class="portal-title">DIONIT CELL PORTAL</div>
          <div class="spacer"></div>
          <div class="user-meta">
            <span>{{ currentUser.username }}</span>
            <button class="btn-logout" @click="logout">Keluar</button>
          </div>
        </header>
        <main class="main-content portal">
          <CustomerPortal />
        </main>
      </div>
    </template>

    <!-- Admin/Technician Layout -->
    <template v-else>
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
          <div class="sidebar-subtitle">DIONIT CELL</div>
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
        <div v-if="currentUser.role === 'admin'" class="sidebar-item" :class="{ active: activeTab === 'monitoring' }" @click="activeTab = 'monitoring'">
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
        <div v-if="currentUser.role === 'admin'" class="sidebar-item" :class="{ active: activeTab === 'customers' }" @click="activeTab = 'customers'">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          <span>Data Pelanggan</span>
        </div>
        <div v-if="currentUser.role === 'admin'" class="sidebar-item" :class="{ active: activeTab === 'invoice' }" @click="activeTab = 'invoice'">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
          <span>Invoice Tagihan</span>
        </div>
        <div v-if="currentUser.role === 'admin'" class="sidebar-item" :class="{ active: activeTab === 'packages' }" @click="activeTab = 'packages'">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
          <span>Paket Internet</span>
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
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          <span>PPPoE Status (Tech)</span>
        </div>

        <!-- PENGATURAN -->
        <div v-if="currentUser.role === 'admin'" class="sidebar-section-title" style="margin-top: 12px;">
          <span>PENGATURAN</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </div>
        <div v-if="currentUser.role === 'admin'" class="sidebar-item" :class="{ active: activeTab === 'settings' }" @click="activeTab = 'settings'">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.32 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          <span>Pengaturan Sistem</span>
        </div>
      </div>

      <div class="sidebar-footer">
        <div class="sidebar-user" style="display: flex; align-items: center; gap: 10px;">
          <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--bg-glass); display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: bold; color: var(--accent-blue);">
            {{ currentUser?.username?.charAt(0).toUpperCase() }}
          </div>
          <div style="display: flex; flex-direction: column; flex: 1;">
            <span style="font-size: 13px; font-weight: 600; color: var(--text-primary);">{{ currentUser?.username }}</span>
            <span style="font-size: 11px; color: var(--text-muted);">{{ currentUser?.role?.toUpperCase() }}</span>
          </div>
          <button @click="logout" style="background: none; border: none; color: #ef4444; cursor: pointer; padding: 4px;" title="Keluar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
          </button>
        </div>
      </div>
    </aside>

    <!-- Main Content Wrapper -->
    <div class="content-wrapper">
      <!-- Header -->
      <header class="app-header">
        <div class="app-header-left">
          <div class="toolbar-title">{{ pageTitle }}</div>
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
        <Dashboard
          v-if="activeTab === 'dashboard'"
          :mikrotiks="mikrotiks"
          @navigate="navigateTo"
        />

        <RealtimeMonitoring
          v-if="activeTab === 'monitoring'"
          :mikrotiks="mikrotiks"
        />

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

        <PackageManagement
          v-if="activeTab === 'packages'"
          :mikrotiks="mikrotiks"
        />

        <CustomerManagement
          v-if="activeTab === 'customers'"
          :mikrotiks="mikrotiks"
        />

        <InvoiceManagement
          v-if="activeTab === 'invoice'"
        />

        <SystemSettings
          v-if="activeTab === 'settings'"
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
          <div class="confirm-title">Hapus Mikrotik?</div>
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
    </template>
  </div>
</template>

<script>
import RouterManagement from './components/router/RouterManagement.vue';
import RouterForm from './components/router/RouterForm.vue';
import PPPoEManagement from './components/pppoe/PPPoEManagement.vue';
import Dashboard from './components/dashboard/Dashboard.vue';
import RealtimeMonitoring from './components/dashboard/RealtimeMonitoring.vue';
import PackageManagement from './components/billing/PackageManagement.vue';
import CustomerManagement from './components/billing/CustomerManagement.vue';
import InvoiceManagement from './components/billing/InvoiceManagement.vue';
import Login from './components/auth/Login.vue';
import CustomerPortal from './components/portal/CustomerPortal.vue';
import SystemSettings from './components/settings/SystemSettings.vue';
import { apiService } from '@/services/api';

export default {
  name: 'App',
  components: {
    RouterManagement,
    RouterForm,
    PPPoEManagement,
    Dashboard,
    RealtimeMonitoring,
    PackageManagement,
    CustomerManagement,
    InvoiceManagement,
    Login,
    CustomerPortal,
    SystemSettings
  },
  data() {
    return {
      activeTab: 'dashboard',
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
      isLightMode: false,
      isLoggedIn: false,
      currentUser: null
    };
  },
  computed: {
    connectedCount() {
      return this.mikrotiks.filter(r => r.is_connected).length;
    },
    offlineCount() {
      return this.mikrotiks.filter(r => !r.is_connected).length;
    },
    pageTitle() {
      const titles = {
        dashboard: 'Dashboard Billing',
        monitoring: 'Realtime Monitoring',
        map: 'Peta Jaringan',
        invoice: 'Invoice Tagihan',
        customers: 'Data Pelanggan',
        packages: 'Paket Internet',
        mikrotik: 'Mikrotik Router',
        pppoe: 'PPPoE Status (Tech)'
      };
      return titles[this.activeTab] || 'Dashboard';
    }
  },
  async mounted() {
    // Initialize Theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      this.isLightMode = true;
      document.documentElement.setAttribute('data-theme', 'light');
    }

    await this.checkAuth();
  },
  methods: {
    async checkAuth() {
      const token = localStorage.getItem('auth_token');
      const savedUser = localStorage.getItem('user');
      
      if (token && savedUser) {
        this.isLoggedIn = true;
        this.currentUser = JSON.parse(savedUser);
        await this.loadMikrotiks();
      }
    },
    handleLoginSuccess(user) {
      this.isLoggedIn = true;
      this.currentUser = user;
      this.loadMikrotiks();
    },
    logout() {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      this.isLoggedIn = false;
      this.currentUser = null;
    },
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

    navigateTo(tab) {
      this.activeTab = tab;
    },

    // ==================
    // Data Loading
    // ==================
    async loadMikrotiks() {
      try {
        const data = await apiService.getAllRouters();
        this.mikrotiks = data || [];
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
        let result;
        if (this.isEditing) {
          result = await apiService.updateRouter(this.editingMikrotik.id, data);
          if (result.success) {
            this.addToast('success', `Mikrotik "${data.name}" berhasil diperbarui`);
          } else {
            this.addToast('error', result.error || 'Gagal update mikrotik');
            return;
          }
        } else {
          result = await apiService.addRouter(data);
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
      if (!this.deletingMikrotik) return;
      this.isDeleting = true;

      try {
        const result = await apiService.deleteRouter(this.deletingMikrotik.id);

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
      this.loadingMikrotiks.add(mikrotik.id);
      this.loadingMikrotiks = new Set(this.loadingMikrotiks);

      try {
        const result = await apiService.connectRouter(mikrotik.id);
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
      this.loadingMikrotiks.add(mikrotik.id);
      this.loadingMikrotiks = new Set(this.loadingMikrotiks);

      try {
        const result = await apiService.disconnectRouter(mikrotik.id);
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
        return await apiService.testConnection(data);
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
