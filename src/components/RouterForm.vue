<template>
  <div class="modal-overlay" @click.self="$emit('cancel')">
    <div class="modal-content">
      <!-- Modal Header -->
      <div class="modal-header">
        <h2 class="modal-title">{{ isEditing ? '✏️ Edit Mikrotik' : '➕ Tambah Mikrotik Baru' }}</h2>
        <button class="modal-close" @click="$emit('cancel')">✕</button>
      </div>

      <!-- Modal Body -->
      <div class="modal-body">
        <form @submit.prevent="handleSubmit">
          <!-- Router Name -->
          <div class="form-group">
            <label class="form-label" for="form-name">
              Nama Mikrotik <span class="required">*</span>
            </label>
            <input
              id="form-name"
              type="text"
              class="form-input"
              :class="{ error: errors.name }"
              v-model="form.name"
              placeholder="mikrotik"
              @input="clearError('name')"
            />
            <div v-if="errors.name" class="form-error">{{ errors.name }}</div>
          </div>

          <!-- IP Address & Port -->
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="form-ip">
                IP Address <span class="required">*</span>
              </label>
              <input
                id="form-ip"
                type="text"
                class="form-input"
                :class="{ error: errors.ip_address }"
                v-model="form.ip_address"
                placeholder="192.168.0.0"
                @input="clearError('ip_address')"
              />
              <div v-if="errors.ip_address" class="form-error">{{ errors.ip_address }}</div>
            </div>
            <div class="form-group">
              <label class="form-label" for="form-port">
                API Port
              </label>
              <input
                id="form-port"
                type="number"
                class="form-input"
                :class="{ error: errors.api_port }"
                v-model.number="form.api_port"
                placeholder="8728"
                min="1"
                max="65535"
                @input="clearError('api_port')"
              />
              <div v-if="errors.api_port" class="form-error">{{ errors.api_port }}</div>
              <div class="form-hint">Default: 8728</div>
            </div>
          </div>

          <!-- MAC Address -->
          <div class="form-group">
            <label class="form-label" for="form-mac">
              MAC Address
            </label>
            <input
              id="form-mac"
              type="text"
              class="form-input"
              :class="{ error: errors.mac_address }"
              v-model="form.mac_address"
              placeholder="(opsional)"
              @input="clearError('mac_address')"
            />
            <div v-if="errors.mac_address" class="form-error">{{ errors.mac_address }}</div>
            <div class="form-hint">Opsional. Digunakan sebagai fallback jika koneksi via IP gagal</div>
          </div>

          <!-- Username & Password -->
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="form-username">
                Username <span class="required">*</span>
              </label>
              <input
                id="form-username"
                type="text"
                class="form-input"
                :class="{ error: errors.username }"
                v-model="form.username"
                placeholder="admin"
                @input="clearError('username')"
              />
              <div v-if="errors.username" class="form-error">{{ errors.username }}</div>
            </div>
            <div class="form-group">
              <label class="form-label" for="form-password">
                Password
              </label>
              <div class="password-wrapper">
                <input
                  id="form-password"
                  :type="showPassword ? 'text' : 'password'"
                  class="form-input"
                  :class="{ error: errors.password }"
                  v-model="form.password"
                  :placeholder="isEditing ? 'Kosongkan jika tidak diubah' : 'password'"
                  @input="clearError('password')"
                />
                <button
                  type="button"
                  class="password-toggle"
                  @click="showPassword = !showPassword"
                  :title="showPassword ? 'Sembunyikan' : 'Tampilkan'"
                >
                  {{ showPassword ? '🙈' : '👁️' }}
                </button>
              </div>
              <div v-if="errors.password" class="form-error">{{ errors.password }}</div>
            </div>
          </div>

          <!-- Description -->
          <div class="form-group">
            <label class="form-label" for="form-description">
              Deskripsi
            </label>
            <textarea
              id="form-description"
              class="form-input"
              v-model="form.description"
              placeholder="Lokasi, model mikrotik, catatan tambahan..."
              rows="3"
            ></textarea>
          </div>

          <!-- Test Connection Result -->
          <div v-if="testResult" :class="['test-result', testResult.success ? 'success' : 'error']">
            <span>{{ testResult.success ? '✅' : '❌' }}</span>
            <span>{{ testResult.message }}</span>
          </div>
        </form>
      </div>

      <!-- Modal Footer -->
      <div class="modal-footer">
        <button
          id="btn-test-connection"
          class="btn btn-secondary"
          @click="handleTestConnection"
          :disabled="isTesting || isSaving"
        >
          <span v-if="isTesting" class="spinner"></span>
          <span v-else>🔌</span>
          {{ isTesting ? 'Testing...' : 'Test Koneksi' }}
        </button>

        <div style="flex: 1;"></div>

        <button class="btn btn-secondary" @click="$emit('cancel')" :disabled="isSaving">
          Batal
        </button>

        <button
          id="btn-save-router"
          class="btn btn-primary"
          @click="handleSubmit"
          :disabled="isSaving"
        >
          <span v-if="isSaving" class="spinner"></span>
          <span v-else>💾</span>
          {{ isSaving ? 'Menyimpan...' : (isEditing ? 'Update Mikrotik' : 'Simpan Mikrotik') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'MikrotikForm',
  props: {
    mikrotik: {
      type: Object,
      default: null
    },
    isEditing: {
      type: Boolean,
      default: false
    },
    testConnectionFn: {
      type: Function,
      default: null
    }
  },
  emits: ['save', 'cancel'],
  data() {
    return {
      form: {
        name: '',
        ip_address: '',
        mac_address: '',
        api_port: 8728,
        username: 'admin',
        password: '',
        description: ''
      },
      errors: {},
      showPassword: false,
      isTesting: false,
      isSaving: false,
      testResult: null
    };
  },
  mounted() {
    if (this.isEditing && this.mikrotik) {
      this.form = {
        name: this.mikrotik.name || '',
        ip_address: this.mikrotik.ip_address || '',
        mac_address: this.mikrotik.mac_address || '',
        api_port: this.mikrotik.api_port || 8728,
        username: this.mikrotik.username || 'admin',
        password: '', // Never pre-fill password
        description: this.mikrotik.description || ''
      };
    }

    // Focus first input
    this.$nextTick(() => {
      const el = document.getElementById('form-name');
      if (el) el.focus();
    });

    // ESC to close
    this._keyHandler = (e) => {
      if (e.key === 'Escape') this.$emit('cancel');
    };
    document.addEventListener('keydown', this._keyHandler);
  },
  beforeUnmount() {
    document.removeEventListener('keydown', this._keyHandler);
  },
  methods: {
    validate() {
      this.errors = {};

      // Name
      if (!this.form.name.trim()) {
        this.errors.name = 'Nama mikrotik wajib diisi';
      }

      // IP Address
      if (!this.form.ip_address.trim()) {
        this.errors.ip_address = 'IP address wajib diisi';
      } else {
        // Basic IP validation
        const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
        if (!ipPattern.test(this.form.ip_address.trim())) {
          this.errors.ip_address = 'Format IP address tidak valid (contoh: 192.168.1.1)';
        } else {
          const parts = this.form.ip_address.trim().split('.');
          const valid = parts.every(p => {
            const n = parseInt(p);
            return n >= 0 && n <= 255;
          });
          if (!valid) {
            this.errors.ip_address = 'Setiap oktet IP harus antara 0-255';
          }
        }
      }

      // Port
      if (this.form.api_port) {
        const port = parseInt(this.form.api_port);
        if (isNaN(port) || port < 1 || port > 65535) {
          this.errors.api_port = 'Port harus antara 1-65535';
        }
      }

      // Username
      if (!this.form.username.trim()) {
        this.errors.username = 'Username wajib diisi';
      }

      // MAC Address (optional but validate format if provided)
      if (this.form.mac_address.trim()) {
        const macPattern = /^([0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}$/;
        if (!macPattern.test(this.form.mac_address.trim())) {
          this.errors.mac_address = 'Format MAC tidak valid (contoh: AA:BB:CC:DD:EE:FF)';
        }
      }

      // Password - no validation needed, MikroTik can have empty password

      return Object.keys(this.errors).length === 0;
    },

    async handleSubmit() {
      if (!this.validate()) return;
      this.isSaving = true;

      try {
        const data = {
          name: this.form.name.trim(),
          ip_address: this.form.ip_address.trim(),
          mac_address: this.form.mac_address.trim() || null,
          api_port: this.form.api_port || 8728,
          username: this.form.username.trim(),
          description: this.form.description.trim() || null
        };

        // Always include password (can be empty for MikroTik default)
        if (this.isEditing && !this.form.password) {
          data.password = '********'; // Signal to backend: don't change
        } else {
          data.password = this.form.password || '';
        }

        this.$emit('save', data);
      } finally {
        this.isSaving = false;
      }
    },

    async handleTestConnection() {
      // Validate at least IP, username, and password for test
      const testErrors = {};
      if (!this.form.ip_address.trim()) testErrors.ip_address = 'IP address wajib diisi untuk test';
      if (!this.form.username.trim()) testErrors.username = 'Username wajib diisi untuk test';

      if (Object.keys(testErrors).length > 0) {
        this.errors = { ...this.errors, ...testErrors };
        return;
      }

      if (!this.testConnectionFn) return;

      this.isTesting = true;
      this.testResult = null;

      try {
        const result = await this.testConnectionFn({
          ip_address: this.form.ip_address.trim(),
          api_port: this.form.api_port || 8728,
          username: this.form.username.trim(),
          password: this.form.password
        });
        this.testResult = result;
      } catch (err) {
        this.testResult = { success: false, message: 'Gagal test koneksi: ' + err.message };
      } finally {
        this.isTesting = false;
      }
    },

    clearError(field) {
      if (this.errors[field]) {
        delete this.errors[field];
        this.errors = { ...this.errors };
      }
      // Clear test result when editing
      this.testResult = null;
    }
  }
};
</script>
