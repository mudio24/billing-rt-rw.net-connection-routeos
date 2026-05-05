<template>
  <div class="modal-overlay" @click.self="close">
    <div class="modal-content">
      <div class="modal-header">
        <h2 class="modal-title">{{ isEditing ? '✏️ Edit User PPPoE' : '➕ Tambah User PPPoE Baru' }}</h2>
        <button class="modal-close" @click="close">✕</button>
      </div>

      <div class="modal-body">
        <form @submit.prevent="submitForm">
          <div class="form-group">
            <label class="form-label" for="name">Username <span class="required">*</span></label>
            <input 
              type="text" 
              id="name" 
              v-model="form.name" 
              class="form-input" 
              placeholder="Contoh: pppoe-client1"
              required
              :disabled="loading"
            >
          </div>

          <div class="form-group">
            <label class="form-label" for="password">Password <span class="required">*</span></label>
            <input 
              type="text" 
              id="password" 
              v-model="form.password" 
              class="form-input" 
              placeholder="Password Dial-Up PPPoE"
              required
              :disabled="loading"
            >
          </div>

          <div class="form-group">
            <label class="form-label" for="profile">Profile / Paket Layanan <span class="required">*</span></label>
            <select 
              id="profile" 
              v-model="form.profile" 
              class="form-input" 
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
            <label class="form-label" for="comment">Catatan Tambahan (Opsional)</label>
            <input 
              type="text" 
              id="comment" 
              v-model="form.comment" 
              class="form-input" 
              placeholder="Contoh: Budi - Blok A1 (Belum Lunas)"
              :disabled="loading"
            >
          </div>
        </form>
      </div>

      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" @click="close" :disabled="loading">Batal</button>
        <button type="button" class="btn btn-primary" @click="submitForm" :disabled="loading || !isValid">
          <span v-if="loading" class="spinner"></span>
          {{ loading ? 'Menyimpan...' : 'Simpan User' }}
        </button>
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
