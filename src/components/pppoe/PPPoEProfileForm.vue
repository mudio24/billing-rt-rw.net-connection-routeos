<template>
  <div class="modal-overlay" @click.self="close">
    <div class="modal-content" style="max-width: 600px;">
      <div class="modal-header">
        <h2 class="modal-title">{{ isEditing ? '✏️ Edit Profile' : '➕ Profile Baru' }}</h2>
        <button class="modal-close" @click="close">✕</button>
      </div>

      <div class="modal-body">
        <div class="modal-subtitle">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
          Disinkronkan langsung ke MikroTik
        </div>

        <form @submit.prevent="submitForm">
          <div class="form-group">
            <label class="form-label">Nama Profile (MikroTik) <span class="required">*</span></label>
            <input type="text" v-model="form.name" class="form-input" placeholder="e.g. 10Mbps_UNLIMITED" required :disabled="loading">
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Harga (Rp)</label>
              <input type="number" v-model.number="form.price" class="form-input" placeholder="0" min="0" :disabled="loading">
            </div>
            <div class="form-group">
              <label class="form-label">Rate Limit</label>
              <input type="text" v-model="form.rate_limit" class="form-input" placeholder="e.g. 10M/10M" :disabled="loading">
            </div>
          </div>

          <datalist id="ip-pools-list">
            <option v-for="pool in ipPools" :key="pool" :value="pool"></option>
          </datalist>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Local Address</label>
              <input type="text" v-model="form.local_address" class="form-input" list="ip-pools-list" placeholder="IP or Pool Name" :disabled="loading">
            </div>
            <div class="form-group">
              <label class="form-label">Remote Address</label>
              <input type="text" v-model="form.remote_address" class="form-input" list="ip-pools-list" placeholder="IP or Pool Name" :disabled="loading">
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Limit Uptime</label>
              <input type="text" v-model="form.limit_uptime" class="form-input" placeholder="e.g. 1h, 30d" :disabled="loading">
            </div>
            <div class="form-group">
              <label class="form-label">Validity (Hari)</label>
              <input type="number" v-model.number="form.validity_days" class="form-input" placeholder="30" min="0" :disabled="loading">
            </div>
          </div>
        </form>
      </div>

      <div class="modal-footer">
        <button class="btn btn-secondary" @click="close" :disabled="loading">Batal</button>
        <button class="btn btn-primary" @click="submitForm" :disabled="loading || !isValid">
          <span v-if="loading" class="spinner"></span>
          {{ loading ? 'Menyimpan...' : (isEditing ? 'Update Profile' : 'Simpan Profile') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PPPoEProfileForm',
  props: {
    profile: { type: Object, default: null },
    isEditing: { type: Boolean, default: false },
    ipPools: { type: Array, default: () => [] }
  },
  data() {
    return {
      form: {
        name: '',
        price: 0,
        rate_limit: '',
        local_address: '',
        remote_address: '',
        limit_uptime: '',
        validity_days: 30
      },
      loading: false
    };
  },
  computed: {
    isValid() { return this.form.name && this.form.name.trim() !== ''; }
  },
  mounted() {
    if (this.isEditing && this.profile) {
      this.form = {
        name: this.profile.name || '',
        price: this.profile.price || 0,
        rate_limit: this.profile['rate-limit'] || '',
        local_address: this.profile['local-address'] || '',
        remote_address: this.profile['remote-address'] || '',
        limit_uptime: this.profile.limit_uptime || '',
        validity_days: this.profile.validity_days || 0
      };
    }
  },
  methods: {
    close() { if (!this.loading) this.$emit('cancel'); },
    submitForm() {
      if (!this.isValid) return;
      this.loading = true;
      this.$emit('save', { ...this.form });
    }
  }
};
</script>

<style scoped>
.modal-subtitle {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-subtle);
}
</style>
