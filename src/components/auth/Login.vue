<template>
  <div class="login-page">
    <!-- Left: Branding Panel -->
    <div class="login-branding">
      <div class="branding-content">
        <div class="branding-logo">
          <div class="logo-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
          </div>
        </div>
        <h1 class="branding-title">DIONIT CELL</h1>
        <p class="branding-subtitle">RT/RW Net Management System</p>
        <div class="branding-features">
          <div class="feature-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
            <span>Kelola pelanggan & tagihan otomatis</span>
          </div>
          <div class="feature-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
            <span>Integrasi MikroTik PPPoE realtime</span>
          </div>
          <div class="feature-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
            <span>Payment Gateway Xendit otomatis</span>
          </div>
        </div>
      </div>
      <div class="branding-footer">
        <p>© 2026 DIONIT CELL — Powered by MikroTik</p>
      </div>
      <!-- Decorative elements -->
      <div class="deco-circle deco-1"></div>
      <div class="deco-circle deco-2"></div>
      <div class="deco-circle deco-3"></div>
    </div>

    <!-- Right: Login Form -->
    <div class="login-form-panel">
      <div class="form-wrapper">
        <!-- Mobile logo (only visible on small screens) -->
        <div class="mobile-logo">
          <div class="logo-icon-sm">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
          </div>
          <span>DIONIT CELL</span>
        </div>

        <div class="form-header">
          <h2>Selamat Datang</h2>
          <p>Masuk ke dashboard untuk mengelola jaringan Anda</p>
        </div>

        <form @submit.prevent="handleLogin" class="login-form">
          <div class="form-group">
            <label for="username">Username</label>
            <div class="input-wrapper">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              <input 
                id="username" 
                v-model="username" 
                type="text" 
                placeholder="Masukkan username" 
                required
                :disabled="loading"
                autocomplete="username"
              >
            </div>
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <div class="input-wrapper">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              <input 
                id="password" 
                v-model="password" 
                :type="showPass ? 'text' : 'password'" 
                placeholder="Masukkan password" 
                required
                :disabled="loading"
                autocomplete="current-password"
              >
              <button type="button" class="pass-toggle" @click="showPass = !showPass" tabindex="-1">
                <svg v-if="!showPass" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              </button>
            </div>
          </div>

          <div v-if="error" class="error-message">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {{ error }}
          </div>

          <button type="submit" class="login-btn" :disabled="loading">
            <span v-if="loading" class="spinner"></span>
            <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
            {{ loading ? 'Memverifikasi...' : 'Masuk ke Sistem' }}
          </button>
        </form>

        <div class="login-divider">
          <span>Info Login</span>
        </div>

        <div class="login-hints">
          <div class="hint-item">
            <span class="hint-role">Admin</span>
            <span class="hint-desc">Akses penuh manajemen jaringan & billing</span>
          </div>
          <div class="hint-item">
            <span class="hint-role">Teknisi</span>
            <span class="hint-desc">Monitoring dan manajemen PPPoE</span>
          </div>
          <div class="hint-item">
            <span class="hint-role">Pelanggan</span>
            <span class="hint-desc">Cek tagihan dan bayar via portal</span>
          </div>
        </div>

        <div class="login-footer">
          <p>Bermasalah saat login? <a href="#">Hubungi Teknisi</a></p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { apiService } from '@/services/api';

export default {
  name: 'Login',
  data() {
    return {
      username: '',
      password: '',
      showPass: false,
      loading: false,
      error: null
    };
  },
  methods: {
    async handleLogin() {
      this.loading = true;
      this.error = null;
      try {
        const res = await apiService.login(this.username, this.password);
        if (res.success) {
          localStorage.setItem('auth_token', res.token);
          localStorage.setItem('user', JSON.stringify(res.user));
          this.$emit('login-success', res.user);
        } else {
          this.error = res.error || 'Username atau password salah';
        }
      } catch (err) {
        this.error = 'Terjadi kesalahan koneksi ke server.';
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>

<style scoped>
/* ===== Full-Screen Split Layout ===== */
.login-page {
  position: fixed;
  inset: 0;
  display: flex;
  background: #0a0e1a;
  font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;
  z-index: 9999;
}

/* ===== LEFT: Branding Panel ===== */
.login-branding {
  flex: 0 0 45%;
  background: linear-gradient(160deg, #1e1b4b 0%, #312e81 30%, #3730a3 60%, #1e40af 100%);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  padding: 60px;
  position: relative;
  overflow: hidden;
}

.branding-content {
  position: relative;
  z-index: 2;
}

.branding-logo {
  margin-bottom: 32px;
}

.logo-icon {
  width: 64px;
  height: 64px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 8px 32px rgba(91, 76, 245, 0.3);
}

.branding-title {
  font-size: 36px;
  font-weight: 900;
  color: white;
  letter-spacing: -0.5px;
  margin-bottom: 8px;
}

.branding-subtitle {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 48px;
}

.branding-features {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 14px;
  color: rgba(255, 255, 255, 0.85);
  font-size: 15px;
  font-weight: 500;
}

.feature-item svg {
  color: #a5b4fc;
  flex-shrink: 0;
}

.branding-footer {
  position: absolute;
  bottom: 40px;
  left: 60px;
  z-index: 2;
}

.branding-footer p {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.3);
}

/* Decorative circles */
.deco-circle {
  position: absolute;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.deco-1 {
  width: 500px;
  height: 500px;
  top: -150px;
  right: -150px;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.15), transparent 70%);
}

.deco-2 {
  width: 350px;
  height: 350px;
  bottom: -100px;
  left: -100px;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.12), transparent 70%);
}

.deco-3 {
  width: 200px;
  height: 200px;
  top: 50%;
  right: 10%;
  border: 1px solid rgba(255, 255, 255, 0.04);
}

/* ===== RIGHT: Form Panel ===== */
.login-form-panel {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  background: #0f172a;
  overflow-y: auto;
}

.form-wrapper {
  width: 100%;
  max-width: 420px;
}

.mobile-logo {
  display: none;
}

.form-header {
  margin-bottom: 36px;
}

.form-header h2 {
  font-size: 28px;
  font-weight: 800;
  color: #f1f5f9;
  margin-bottom: 8px;
}

.form-header p {
  font-size: 15px;
  color: #64748b;
  line-height: 1.5;
}

/* ===== Form Elements ===== */
.login-form {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 13px;
  font-weight: 600;
  color: #94a3b8;
  letter-spacing: 0.02em;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-wrapper > svg:first-child {
  position: absolute;
  left: 16px;
  color: #475569;
  pointer-events: none;
  z-index: 1;
}

.input-wrapper input {
  width: 100%;
  padding: 14px 48px 14px 48px;
  background: rgba(15, 23, 42, 0.6);
  border: 1.5px solid rgba(148, 163, 184, 0.15);
  border-radius: 14px;
  color: #f1f5f9;
  font-size: 15px;
  font-family: inherit;
  transition: all 0.25s ease;
  outline: none;
  box-sizing: border-box;
}

.input-wrapper input::placeholder {
  color: #475569;
}

.input-wrapper input:focus {
  border-color: #6366f1;
  background: rgba(15, 23, 42, 0.9);
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.15), 0 4px 16px rgba(0, 0, 0, 0.2);
}

.input-wrapper input:disabled {
  opacity: 0.5;
}

.pass-toggle {
  position: absolute;
  right: 14px;
  background: none;
  border: none;
  color: #475569;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
}

.pass-toggle:hover {
  color: #94a3b8;
}

/* Error */
.error-message {
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: #f87171;
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 10px;
  animation: shake 0.4s ease;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-6px); }
  75% { transform: translateX(6px); }
}

/* Login Button */
.login-btn {
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  color: white;
  border: none;
  padding: 15px 24px;
  border-radius: 14px;
  font-size: 15px;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-top: 6px;
  box-shadow: 0 4px 16px rgba(99, 102, 241, 0.3);
}

.login-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #818cf8 0%, #6366f1 100%);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(99, 102, 241, 0.4);
}

.login-btn:active:not(:disabled) {
  transform: translateY(0);
}

.login-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

/* Divider */
.login-divider {
  display: flex;
  align-items: center;
  gap: 16px;
  margin: 28px 0 20px;
}

.login-divider::before,
.login-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: rgba(148, 163, 184, 0.1);
}

.login-divider span {
  font-size: 11px;
  font-weight: 700;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

/* Hints */
.login-hints {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 28px;
}

.hint-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 10px;
  transition: background 0.2s;
}

.hint-item:hover {
  background: rgba(255, 255, 255, 0.04);
}

.hint-role {
  font-size: 11px;
  font-weight: 700;
  color: #a5b4fc;
  background: rgba(99, 102, 241, 0.1);
  padding: 3px 10px;
  border-radius: 6px;
  min-width: 72px;
  text-align: center;
  flex-shrink: 0;
}

.hint-desc {
  font-size: 12px;
  color: #64748b;
}

/* Footer */
.login-footer {
  text-align: center;
}

.login-footer p {
  font-size: 13px;
  color: #475569;
}

.login-footer a {
  color: #818cf8;
  text-decoration: none;
  font-weight: 600;
}

.login-footer a:hover {
  text-decoration: underline;
}

/* Spinner */
.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ===== RESPONSIVE ===== */

/* Tablet */
@media (max-width: 1024px) {
  .login-branding {
    flex: 0 0 40%;
    padding: 40px;
  }

  .branding-title {
    font-size: 28px;
  }

  .branding-footer {
    left: 40px;
    bottom: 30px;
  }
}

/* Mobile */
@media (max-width: 768px) {
  .login-page {
    flex-direction: column;
  }

  .login-branding {
    display: none;
  }

  .login-form-panel {
    padding: 24px;
    align-items: flex-start;
    padding-top: 60px;
  }

  .mobile-logo {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 36px;
  }

  .logo-icon-sm {
    width: 44px;
    height: 44px;
    background: linear-gradient(135deg, #6366f1, #4f46e5);
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
  }

  .mobile-logo span {
    font-size: 20px;
    font-weight: 900;
    color: #f1f5f9;
    letter-spacing: -0.3px;
  }

  .form-header h2 {
    font-size: 24px;
  }

  .form-wrapper {
    max-width: 100%;
  }
}

/* Small mobile */
@media (max-width: 400px) {
  .login-form-panel {
    padding: 20px;
    padding-top: 40px;
  }

  .form-header h2 {
    font-size: 22px;
  }

  .input-wrapper input {
    padding: 12px 44px 12px 44px;
    font-size: 14px;
  }

  .login-btn {
    padding: 13px 20px;
    font-size: 14px;
  }
}
</style>
