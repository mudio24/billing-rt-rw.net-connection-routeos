<template>
  <div>
    <!-- Toolbar -->
    <div class="toolbar">
      <div class="toolbar-left">
        <span class="toolbar-title">Mikrotik List</span>
        <span class="router-count">{{ filteredMikrotiks.length }}</span>
      </div>

      <div class="search-bar">
        <!-- search icon removed -->
        <input
          id="search-mikrotiks"
          type="text"
          placeholder="Cari mikrotik berdasarkan nama, IP..."
          v-model="searchQuery"
          @input="emitSearch"
        />
      </div>

      <button id="btn-add-mikrotik" class="btn btn-primary" @click="$emit('add-mikrotik')">
        Tambah Mikrotik Baru
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="empty-state">
      <div class="spinner spinner-lg" style="color: var(--accent-blue); margin-bottom: 16px;"></div>
      <div class="empty-title">Memuat data mikrotik...</div>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredMikrotiks.length === 0 && !searchQuery" class="empty-state">
      <div class="empty-title">Belum Ada Mikrotik</div>
      <div class="empty-description">
        Mulai kelola Mikrotik kamu dengan menambahkan mikrotik pertama.
        Klik tombol di bawah untuk memulai.
      </div>
      <button class="btn btn-primary" @click="$emit('add-mikrotik')">
        Tambah Mikrotik Pertama
      </button>
    </div>

    <!-- No Search Results -->
    <div v-else-if="filteredMikrotiks.length === 0 && searchQuery" class="empty-state">
      <div class="empty-title">Tidak Ditemukan</div>
      <div class="empty-description">
        Tidak ada mikrotik yang cocok dengan pencarian "{{ searchQuery }}".
        Coba kata kunci lain.
      </div>
    </div>

    <!-- Mikrotik Grid -->
    <div v-else class="router-grid">
      <RouterCard
        v-for="mikrotik in filteredMikrotiks"
        :key="mikrotik.id"
        :mikrotik="mikrotik"
        :is-loading="loadingMikrotiks.has(mikrotik.id)"
        @edit="$emit('edit-mikrotik', mikrotik)"
        @delete="$emit('delete-mikrotik', mikrotik)"
        @connect="$emit('connect-mikrotik', mikrotik)"
        @disconnect="$emit('disconnect-mikrotik', mikrotik)"
        @copy-ip="$emit('copy-ip', mikrotik.ip_address)"
      />
    </div>
  </div>
</template>

<script>
import RouterCard from './RouterCard.vue';

export default {
  name: 'MikrotikManagement',
  components: {
    RouterCard
  },
  props: {
    mikrotiks: {
      type: Array,
      default: () => []
    },
    loadingMikrotiks: {
      type: Set,
      default: () => new Set()
    }
  },
  emits: [
    'add-mikrotik',
    'edit-mikrotik',
    'delete-mikrotik',
    'connect-mikrotik',
    'disconnect-mikrotik',
    'search',
    'copy-ip'
  ],
  data() {
    return {
      searchQuery: '',
      isLoading: false
    };
  },
  computed: {
    filteredMikrotiks() {
      if (!this.searchQuery.trim()) {
        return this.mikrotiks;
      }
      const q = this.searchQuery.toLowerCase().trim();
      return this.mikrotiks.filter(r =>
        r.name.toLowerCase().includes(q) ||
        r.ip_address.toLowerCase().includes(q) ||
        (r.description && r.description.toLowerCase().includes(q))
      );
    }
  },
  methods: {
    emitSearch() {
      this.$emit('search', this.searchQuery);
    }
  }
};
</script>
