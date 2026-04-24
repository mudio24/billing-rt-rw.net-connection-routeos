<template>
  <div class="modal-overlay" @click.self="close">
    <div class="modal-content" style="max-width: 600px; padding: 24px;">
      <div class="modal-header" style="border-bottom: none; align-items: flex-start; margin-bottom: 20px;">
        <div style="display: flex; flex-direction: column;">
          <h2 class="modal-title" style="font-size: 28px; font-weight: 800; color: var(--text-primary);">
            {{ isEditing ? 'EDIT' : 'NEW' }} <span style="color: #5b4cf5;">PROFILE</span>
          </h2>
          <div style="font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.1em; display: flex; align-items: center; gap: 4px; margin-top: 4px;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
            SYNCED DIRECTLY TO MIKROTIK INSTANCE
          </div>
        </div>
        <button class="modal-close" @click="close" style="font-size: 24px; color: var(--text-muted);">✕</button>
      </div>

      <div class="modal-body">
        <form @submit.prevent="submitForm">
          <!-- Full Width: Profile Name -->
          <div class="form-group">
            <label for="name">PROFILE NAME (MIKROTIK)</label>
            <input 
              type="text" 
              id="name" 
              v-model="form.name" 
              class="form-control focus-blue" 
              placeholder="e.g. 10Mbps_UNLIMITED"
              required
              :disabled="loading"
            >
          </div>

          <!-- Grid: Price & Rate Limit -->
          <div class="form-grid">
            <div class="form-group">
              <label for="price">PRICE (RP)</label>
              <input 
                type="number" 
                id="price" 
                v-model.number="form.price" 
                class="form-control" 
                placeholder="0"
                min="0"
                :disabled="loading"
                style="color: #5b4cf5; font-weight: 700;"
              >
            </div>
            <div class="form-group">
              <label for="rate_limit">RATE LIMIT</label>
              <input 
                type="text" 
                id="rate_limit" 
                v-model="form.rate_limit" 
                class="form-control" 
                placeholder="e.g. 10M/10M"
                :disabled="loading"
              >
            </div>
          </div>

          <!-- Datalist for IP Pools -->
          <datalist id="ip-pools-list">
            <option v-for="pool in ipPools" :key="pool" :value="pool"></option>
          </datalist>

          <!-- Grid: Local Address & Remote Address -->
          <div class="form-grid">
            <div class="form-group">
              <label for="local_address">LOCAL ADDRESS</label>
              <input 
                type="text" 
                id="local_address" 
                v-model="form.local_address" 
                class="form-control" 
                list="ip-pools-list"
                placeholder="IP or Pool Name"
                :disabled="loading"
              >
            </div>
            <div class="form-group">
              <label for="remote_address">REMOTE ADDRESS</label>
              <input 
                type="text" 
                id="remote_address" 
                v-model="form.remote_address" 
                class="form-control" 
                list="ip-pools-list"
                placeholder="IP or Pool Name"
                :disabled="loading"
              >
            </div>
          </div>

          <!-- Grid: Limit Uptime & Validity -->
          <div class="form-grid">
            <div class="form-group">
              <label for="limit_uptime">LIMIT UPTIME</label>
              <input 
                type="text" 
                id="limit_uptime" 
                v-model="form.limit_uptime" 
                class="form-control" 
                placeholder="e.g. 1h, 30d"
                :disabled="loading"
              >
            </div>
            <div class="form-group">
              <label for="validity">VALIDITY (DAYS)</label>
              <input 
                type="number" 
                id="validity" 
                v-model.number="form.validity_days" 
                class="form-control" 
                placeholder="30"
                min="0"
                :disabled="loading"
                style="font-weight: 700;"
              >
            </div>
          </div>

          <div class="modal-footer" style="border-top: none; padding-top: 10px;">
            <button type="submit" class="btn btn-full" :disabled="loading || !isValid">
              <span v-if="loading" class="spinner" style="margin-right: 8px;"></span>
              {{ loading ? 'SYNCING...' : (isEditing ? 'UPDATE PROFILE ↗' : 'ESTABLISH PROFILE ↗') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PPPoEProfileForm',
  props: {
    profile: {
      type: Object,
      default: null
    },
    isEditing: {
      type: Boolean,
      default: false
    },
    ipPools: {
      type: Array,
      default: () => []
    }
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
    isValid() {
      return this.form.name && this.form.name.trim() !== '';
    }
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
    close() {
      if (!this.loading) {
        this.$emit('cancel');
      }
    },
    submitForm() {
      if (!this.isValid) return;
      this.loading = true;
      this.$emit('save', { ...this.form });
    }
  }
};
</script>

<style scoped>
.form-group {
  margin-bottom: 20px;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

label {
  display: block;
  margin-bottom: 6px;
  font-size: 11px;
  font-weight: 700;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.form-control {
  width: 100%;
  padding: 14px 16px;
  background: var(--bg-primary);
  border: 1px solid var(--border-input);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-family: inherit;
  font-size: 14px;
  transition: all var(--transition-normal);
}

.form-control:focus {
  outline: none;
  background: var(--bg-input-focus);
  border-color: var(--border-input-focus);
  box-shadow: 0 0 0 3px rgba(91, 76, 245, 0.1);
}

.focus-blue:focus {
  border-color: #5b4cf5;
  box-shadow: 0 0 0 3px rgba(91, 76, 245, 0.2);
}

.form-control:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-full {
  width: 100%;
  padding: 16px;
  background: #5b4cf5;
  color: white;
  font-weight: 700;
  letter-spacing: 0.05em;
  border-radius: var(--radius-md);
  border: none;
  cursor: pointer;
  transition: background 0.2s;
  display: flex;
  justify-content: center;
  align-items: center;
}

.btn-full:hover {
  background: #4a3be0;
}

.btn-full:disabled {
  background: var(--border-input);
  color: var(--text-muted);
  cursor: not-allowed;
}
</style>
