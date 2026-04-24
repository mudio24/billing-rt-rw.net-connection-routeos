<template>
  <div :class="['router-card', { connected: mikrotik.is_connected }]">
    <!-- Card Header -->
    <div class="card-header">
      <div class="card-info">
        <div class="card-icon">
          <span :class="['status-indicator', mikrotik.is_connected ? 'success' : 'error']"></span>
        </div>
        <div class="card-details">
          <div class="card-name" :title="mikrotik.name">{{ mikrotik.name }}</div>
          <div class="card-ip" @click="$emit('copy-ip')" title="Copy IP">
            <span>{{ mikrotik.ip_address }}:{{ mikrotik.api_port }}</span>
          </div>
        </div>
      </div>
      <div class="card-actions">
        <button
          :id="'btn-edit-' + mikrotik.id"
          class="btn btn-sm btn-secondary"
          @click="$emit('edit')"
          :disabled="isLoading"
        >
          Edit
        </button>
        <button
          :id="'btn-delete-' + mikrotik.id"
          class="btn btn-sm btn-danger"
          @click="$emit('delete')"
          :disabled="isLoading"
        >
          Hapus
        </button>
      </div>
    </div>

    <!-- Card Body -->
    <div class="card-body">
      <!-- Status Badge -->
      <div>
        <span :class="['status-badge', statusClass]">
          <span v-if="isLoading" class="spinner" style="width: 10px; height: 10px; border-width: 1.5px;"></span>
          <span v-else class="status-dot"></span>
          {{ statusText }}
        </span>
      </div>

      <!-- Description -->
      <div v-if="mikrotik.description" class="card-description">
        {{ mikrotik.description }}
      </div>

      <!-- Meta Info -->
      <div class="card-meta">
        <div class="meta-item">
          <span>Username: {{ mikrotik.username }}</span>
        </div>
        <div class="meta-item">
          <span>Port: {{ mikrotik.api_port }}</span>
        </div>
        <div v-if="mikrotik.mac_address" class="meta-item">
          <span class="font-mono">MAC: {{ mikrotik.mac_address }}</span>
        </div>
      </div>
    </div>

    <!-- Card Footer -->
    <div class="card-footer">
      <div class="card-footer-info">
        <div v-if="mikrotik.last_connected" class="last-connected">
          Terakhir: {{ formatTime(mikrotik.last_connected) }}
        </div>
        <div v-if="mikrotik.error_message && !mikrotik.is_connected" class="error-msg" :title="mikrotik.error_message">
          Error: {{ mikrotik.error_message }}
        </div>
        <div v-if="!mikrotik.last_connected && !mikrotik.error_message" class="last-connected">
          Belum pernah terkoneksi
        </div>
      </div>

      <div>
        <button
          v-if="mikrotik.is_connected"
          :id="'btn-disconnect-' + mikrotik.id"
          class="btn btn-sm btn-danger"
          @click="$emit('disconnect')"
          :disabled="isLoading"
        >
          <span v-if="isLoading" class="spinner" style="width: 12px; height: 12px; border-width: 1.5px;"></span>
          {{ isLoading ? 'Disconnecting...' : 'Disconnect' }}
        </button>
        <button
          v-else
          :id="'btn-connect-' + mikrotik.id"
          class="btn btn-sm btn-success"
          @click="$emit('connect')"
          :disabled="isLoading"
        >
          <span v-if="isLoading" class="spinner" style="width: 12px; height: 12px; border-width: 1.5px;"></span>
          {{ isLoading ? 'Connecting...' : 'Connect' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'MikrotikCard',
  props: {
    mikrotik: {
      type: Object,
      required: true
    },
    isLoading: {
      type: Boolean,
      default: false
    }
  },
  emits: ['edit', 'delete', 'connect', 'disconnect', 'copy-ip'],
  computed: {
    statusClass() {
      if (this.isLoading) return 'loading';
      return this.mikrotik.is_connected ? 'connected' : 'offline';
    },
    statusText() {
      if (this.isLoading) return 'Menghubungkan...';
      return this.mikrotik.is_connected ? 'Connected' : 'Offline';
    }
  },
  methods: {
    formatTime(dateStr) {
      if (!dateStr) return '-';
      try {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now - date;
        const diffMin = Math.floor(diffMs / 60000);
        const diffHour = Math.floor(diffMs / 3600000);
        const diffDay = Math.floor(diffMs / 86400000);

        if (diffMin < 1) return 'Baru saja';
        if (diffMin < 60) return `${diffMin} menit lalu`;
        if (diffHour < 24) return `${diffHour} jam lalu`;
        if (diffDay < 7) return `${diffDay} hari lalu`;

        return date.toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      } catch {
        return dateStr;
      }
    }
  }
};
</script>
