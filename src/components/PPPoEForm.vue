<template>
  <div class="modal-overlay" @click.self="close">
    <div class="modal-content">
      <div class="modal-header">
        <h2 class="modal-title">{{ isEditing ? 'Edit User PPPoE' : 'Tambah User PPPoE Baru' }}</h2>
        <button class="modal-close" @click="close">✕</button>
      </div>

      <div class="modal-body">
        <form @submit.prevent="submitForm">
          <div class="form-group">
            <label for="name">Username *</label>
            <input 
              type="text" 
              id="name" 
              v-model="form.name" 
              class="form-control" 
              placeholder="Contoh: pppoe-client1"
              required
              :disabled="loading"
            >
          </div>

          <div class="form-group">
            <label for="password">Password *</label>
            <input 
              type="text" 
              id="password" 
              v-model="form.password" 
              class="form-control" 
              placeholder="Password Dial-Up PPPoE"
              required
              :disabled="loading"
            >
          </div>

          <div class="form-group">
            <label for="profile">Profile / Paket Layanan *</label>
            <select 
              id="profile" 
              v-model="form.profile" 
              class="form-control" 
              required
              :disabled="loading"
            >
              <option value="" disabled>Pilih Profile...</option>
              <option value="default">default</option>
              <option v-for="prof in profiles" :key="prof['.id']" :value="prof.name">
                {{ prof.name }} 
              </option>
            </select>
          </div>

          <div class="form-group">
            <label for="comment">Catatan Tambahan (Opsional)</label>
            <input 
              type="text" 
              id="comment" 
              v-model="form.comment" 
              class="form-control" 
              placeholder="Contoh: Budi - Blok A1 (Belum Lunas)"
              :disabled="loading"
            >
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="close" :disabled="loading">Batal</button>
            <button type="submit" class="btn btn-primary" :disabled="loading || !isValid">
              <span v-if="loading" class="spinner"></span>
              {{ loading ? 'Menyimpan...' : 'Simpan User' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PPPoEForm',
  props: {
    secret: {
      type: Object,
      default: null
    },
    isEditing: {
      type: Boolean,
      default: false
    },
    profiles: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      form: {
        name: '',
        password: '',
        profile: '',
        comment: ''
      },
      loading: false
    };
  },
  computed: {
    isValid() {
      return this.form.name && this.form.password && this.form.profile;
    }
  },
  mounted() {
    if (this.isEditing && this.secret) {
      this.form = {
        name: this.secret.name || '',
        password: this.secret.password || '',
        profile: this.secret.profile || 'default',
        comment: this.secret.comment || ''
      };
    } else {
      // Set default profile if available
      if (this.profiles && this.profiles.length > 0) {
        // usually default is named 'default'
        const hasDefault = this.profiles.find(p => p.name === 'default');
        if (hasDefault) this.form.profile = 'default';
        else this.form.profile = this.profiles[0].name;
      }
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
      // Emission is caught by parent which handles the API request
      this.$emit('save', { ...this.form });
    }
  }
};
</script>

<style scoped>
/* Inherits modal styles from style.css, specific tweaks for this form */
.form-group {
  margin-bottom: 20px;
}

label {
  display: block;
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
}

.form-control {
  width: 100%;
  padding: 12px 16px;
  background: var(--bg-input);
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
  box-shadow: 0 0 0 3px var(--accent-blue-glow);
}

.form-control:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
