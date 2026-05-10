<template>
  <div class="wa-container">
    <!-- Header -->
    <div class="wa-header">
      <div class="header-content">
        <div class="header-left">
          <div class="header-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
            </svg>
          </div>
          <div>
            <h1 class="header-title">WhatsApp Gateway</h1>
            <p class="header-subtitle">Kelola notifikasi & pesan otomatis WhatsApp</p>
          </div>
        </div>
        <div class="header-status">
          <div class="status-badge" :class="waStatus.isReady ? 'status-connected' : 'status-disconnected'">
            <span class="status-dot"></span>
            <span class="status-text">{{ waStatus.isReady ? 'Terhubung' : 'Terputus' }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Tabs Navigation -->
    <div class="wa-tabs-wrapper">
      <div class="wa-tabs">
        <button 
          class="wa-tab-button"
          :class="{ active: activeTab === 'koneksi' }"
          @click="activeTab = 'koneksi'"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 23a11.05 11.05 0 0 1-9.26-5.54 11.04 11.04 0 0 1 1.94-13.81"></path>
            <path d="M1 12a11 11 0 0 1 18.26-5.54"></path>
            <circle cx="12" cy="12" r="2"></circle>
          </svg>
          <span>Status & Koneksi</span>
        </button>
        <button 
          class="wa-tab-button"
          :class="{ active: activeTab === 'template' }"
          @click="activeTab = 'template'"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="12" y1="13" x2="8" y2="13"></line>
            <line x1="12" y1="17" x2="8" y2="17"></line>
          </svg>
          <span>Template Pesan</span>
        </button>
        <button 
          class="wa-tab-button"
          :class="{ active: activeTab === 'broadcast' }"
          @click="activeTab = 'broadcast'"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
          </svg>
          <span>Kirim Broadcast</span>
        </button>
      </div>
    </div>

    <!-- Content Area -->
    <div class="wa-content">
      
      <!-- TAB: KONEKSI -->
      <div v-if="activeTab === 'koneksi'" class="wa-pane wa-pane-center">
        <transition name="fade" mode="out-in">
          <div v-if="waStatus.isReady" class="connection-card success-card" key="connected">
            <div class="card-icon success-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            <h2 class="card-title">WhatsApp Terhubung</h2>
            <p class="card-description">Sistem Anda sekarang siap untuk mengirim notifikasi tagihan, pengingat, dan pesan broadcast secara otomatis kepada pelanggan.</p>
            <div class="connection-info">
              <div class="info-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="1"></circle>
                  <path d="M12 1v6m0 6v4"></path>
                  <path d="M4.22 4.22l4.24 4.24m5.08 5.08l4.24 4.24"></path>
                  <path d="M1 12h6m6 0h4"></path>
                  <path d="M4.22 19.78l4.24-4.24m5.08-5.08l4.24-4.24"></path>
                </svg>
                <span>Ponsel terhubung harus selalu memiliki koneksi internet</span>
              </div>
              <div class="info-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
                <span>Jangan bagikan akun WhatsApp Anda dengan orang lain</span>
              </div>
            </div>
            <button @click="logoutWA" class="btn-disconnect">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              Putuskan Koneksi
            </button>
          </div>

          <div v-else-if="waStatus.qrCode" class="connection-card qr-card" key="qr">
            <h2 class="card-title">Pindai QR Code</h2>
            <p class="card-description">Buka WhatsApp di ponsel Anda, masuk ke <strong>Menu > Perangkat tertaut > Tautkan perangkat</strong>, lalu pindai QR code di bawah ini.</p>
            <div class="qr-container">
              <img :src="waStatus.qrCode" alt="QR Code" class="qr-image" />
              <p class="qr-expires">QR Code berlaku selama 45 detik</p>
            </div>
            <button @click="initWA" class="btn-retry">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="1 4 1 10 7 10"></polyline>
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
              </svg>
              Muat Ulang QR Code
            </button>
          </div>

          <div v-else class="connection-card empty-card" key="empty">
            <div class="card-icon empty-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="9" y1="9" x2="15" y2="9"></line>
                <line x1="9" y1="15" x2="15" y2="15"></line>
              </svg>
            </div>
            <h2 class="card-title">Hubungkan WhatsApp Anda</h2>
            <p class="card-description">Untuk mengaktifkan fitur notifikasi otomatis dan broadcast pesan, silakan hubungkan akun WhatsApp Anda terlebih dahulu dengan memindai QR code.</p>
            <div class="benefits-list">
              <div class="benefit-item">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                  <path d="M10 15.172l9.192-9.193 1.415 1.414L10 18l-7.071-7.071 1.414-1.415z"></path>
                </svg>
                <span>Kirim notifikasi tagihan otomatis</span>
              </div>
              <div class="benefit-item">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                  <path d="M10 15.172l9.192-9.193 1.415 1.414L10 18l-7.071-7.071 1.414-1.415z"></path>
                </svg>
                <span>Pengingat pembayaran yang terjadwal</span>
              </div>
              <div class="benefit-item">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                  <path d="M10 15.172l9.192-9.193 1.415 1.414L10 18l-7.071-7.071 1.414-1.415z"></path>
                </svg>
                <span>Broadcast pesan ke banyak pelanggan</span>
              </div>
              <div class="benefit-item">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                  <path d="M10 15.172l9.192-9.193 1.415 1.414L10 18l-7.071-7.071 1.414-1.415z"></path>
                </svg>
                <span>Template pesan yang dapat disesuaikan</span>
              </div>
            </div>
            <button @click="initWA" class="btn-connect">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="1"></circle>
                <path d="M12 1v6m0 6v4"></path>
                <path d="M4.22 4.22l4.24 4.24m5.08 5.08l4.24 4.24"></path>
                <path d="M1 12h6m6 0h4"></path>
                <path d="M4.22 19.78l4.24-4.24m5.08-5.08l4.24-4.24"></path>
              </svg>
              Mulai Koneksi WhatsApp
            </button>
          </div>
        </transition>
      </div>

      <!-- TAB: TEMPLATE -->
      <div v-if="activeTab === 'template'" class="wa-pane wa-pane-split">
        <div class="pane-left">
          <!-- Variables Section -->
          <div class="section">
            <div class="section-header">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
              <h3 class="section-title">Variabel Dinamis</h3>
            </div>
            <p class="section-hint">Klik tombol untuk menyisipkan variabel ke pesan Anda:</p>
            <div class="variables-grid">
              <button type="button" class="variable-btn" @click="insertVar('{{name}}')" title="Nama Pelanggan">
                <span class="var-name">Nama</span>
                <code class="var-code">{{name}}</code>
              </button>
              <button type="button" class="variable-btn" @click="insertVar('{{company}}')" title="Nama ISP/Perusahaan">
                <span class="var-name">ISP</span>
                <code class="var-code">{{company}}</code>
              </button>
              <button type="button" class="variable-btn" @click="insertVar('{{invoice_number}}')" title="Nomor Invoice">
                <span class="var-name">Invoice</span>
                <code class="var-code">{{invoice_number}}</code>
              </button>
              <button type="button" class="variable-btn" @click="insertVar('{{amount}}')" title="Total Tagihan">
                <span class="var-name">Total</span>
                <code class="var-code">{{amount}}</code>
              </button>
              <button type="button" class="variable-btn" @click="insertVar('{{due_date}}')" title="Tanggal Jatuh Tempo">
                <span class="var-name">Tgl Tempo</span>
                <code class="var-code">{{due_date}}</code>
              </button>
              <button type="button" class="variable-btn" @click="insertVar('{{package}}')" title="Paket Internet">
                <span class="var-name">Paket</span>
                <code class="var-code">{{package}}</code>
              </button>
              <button type="button" class="variable-btn" @click="insertVar('{{period}}')" title="Periode Tagihan">
                <span class="var-name">Periode</span>
                <code class="var-code">{{period}}</code>
              </button>
              <button type="button" class="variable-btn" @click="insertVar('{{payment_link}}')" title="Link Pembayaran">
                <span class="var-name">Link Bayar</span>
                <code class="var-code">{{payment_link}}</code>
              </button>
            </div>
          </div>

          <!-- Template Selection -->
          <div class="section">
            <div class="section-header">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
              </svg>
              <h3 class="section-title">Pilih Template</h3>
            </div>
            <div v-if="templates.length === 0" class="empty-state">
              <p>Tidak ada template tersedia</p>
            </div>
            <div v-else class="template-list">
              <button 
                v-for="tpl in templates" 
                :key="tpl.id"
                class="template-item"
                :class="{ active: selectedTemplate?.id === tpl.id }"
                @click="selectedTemplate = tpl"
              >
                <div class="template-item-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  </svg>
                </div>
                <div class="template-item-content">
                  <p class="template-item-name">{{ tpl.nama_template }}</p>
                  <p class="template-item-preview">{{ tpl.isi_pesan.substring(0, 50) }}...</p>
                </div>
              </button>
            </div>
          </div>
        </div>

        <div class="pane-right">
          <!-- Template Preview -->
          <div v-if="selectedTemplate" class="section preview-section" style="display: flex; flex-direction: column; height: 100%; padding: 0; overflow: hidden;">
            <div class="section-header" style="padding: 20px; border-bottom: 1px solid var(--border-light);">
              <h3 class="section-title">Pratinjau Pesan</h3>
            </div>
            
            <div class="chat-preview-container">
              <div class="chat-header">
                <div class="chat-back">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="19" y1="12" x2="5" y2="12"></line>
                    <polyline points="12 19 5 12 12 5"></polyline>
                  </svg>
                </div>
                <div class="chat-avatar">B</div>
                <div class="chat-info">
                  <h4>Budi Santoso</h4>
                  <p>online</p>
                </div>
                <div class="chat-menu">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="5" r="1"></circle>
                    <circle cx="12" cy="12" r="1"></circle>
                    <circle cx="12" cy="19" r="1"></circle>
                  </svg>
                </div>
              </div>

              <div class="chat-body">
                <!-- Incoming Message -->
                <div class="message-group incoming">
                  <div class="chat-bubble incoming-bubble">
                    <span>Halo, saya ingin tahu tentang tagihan saya</span>
                  </div>
                  <div class="message-time">10:42</div>
                </div>

                <div class="date-divider">Hari ini</div>

                <!-- Outgoing Message -->
                <div class="message-group outgoing">
                  <div class="chat-bubble outgoing-bubble">
                    <div v-html="previewText"></div>
                  </div>
                  <div class="message-time">10:45 
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.46 6.46l-1.41-1.41L9 13.59V2H7v15h2v-2.59l8.46-8.46z"></path>
                    </svg>
                  </div>
                </div>
              </div>

              <div class="chat-input-area">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12" y2="8"></line>
                </svg>
                <div class="input-placeholder">Ketik pesan</div>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                  <path d="M16.6915026,12.4744748 L3.50612381,13.2599618 C3.19218622,13.2599618 3.03521743,13.4170592 3.03521743,13.5741566 L1.15159189,20.0151496 C0.8376543,20.8006365 0.99,21.89 1.77946707,22.52 C2.41,22.99 3.50612381,23.1 4.13399899,22.8429026 L21.714504,14.0454487 C22.6563168,13.5741566 23.1272231,12.6315722 22.9702544,11.6889879 L4.13399899,1.16346272 C3.34915502,0.9 2.40734225,0.9 1.77946707,1.4429026 C0.994623095,2.0605983 0.837654326,3.0031827 1.15159189,3.98776711 L3.03521743,10.4287602 C3.03521743,10.5858575 3.34915502,10.7429549 3.50612381,10.7429549 L16.6915026,11.5284418 C16.6915026,11.5284418 17.1624089,11.5284418 17.1624089,12.0013721 C17.1624089,12.4744748 16.6915026,12.4744748 16.6915026,12.4744748 Z"></path>
                </svg>
              </div>
            </div>
          </div>

          <div v-else class="empty-state centered">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
            </svg>
            <p>Pilih template untuk melihat preview</p>
          </div>
        </div>

        <div class="editor-panel">
          <!-- Template Editor -->
          <div v-if="selectedTemplate" class="section" style="display: flex; flex-direction: column; height: 100%;">
            <div class="section-header">
              <h3 class="section-title">Edit Template</h3>
              <span class="template-badge">{{ selectedTemplate.nama_template }}</span>
            </div>
            <label class="editor-label">Isi Pesan</label>
            <textarea 
              ref="textareaRef"
              v-model="selectedTemplate.isi_pesan" 
              class="message-textarea"
              placeholder="Ketik pesan template Anda di sini..."
            ></textarea>
            <p class="editor-hint">💡 Gunakan <strong>*teks*</strong> untuk membuat teks tebal</p>
            <button @click="saveTemplate" class="btn-save" :disabled="!selectedTemplate.isi_pesan.trim()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                <polyline points="17 21 17 13 7 13 7 21"></polyline>
                <polyline points="7 3 7 8 15 8"></polyline>
              </svg>
              Simpan Template
            </button>
          </div>
        </div>
      </div>

      <!-- TAB: BROADCAST -->
      <div v-if="activeTab === 'broadcast'" class="wa-pane wa-pane-split">
        <div class="pane-left">
          <!-- Warning -->
          <div class="alert alert-warning">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            <div>
              <strong>Perhatian:</strong> Fitur broadcast akan mengirim pesan ke banyak pelanggan. Gunakan dengan bijak untuk menghindari akun Anda diblokir.
            </div>
          </div>

          <!-- Broadcast Options -->
          <div class="section">
            <label class="form-label">
              <span class="label-text">Kirim Ke</span>
              <select v-model="broadcastForm.targets" class="form-select">
                <option value="all">Semua Pelanggan (Active & Suspended)</option>
                <option value="active">Pelanggan Aktif Saja</option>
                <option value="suspended">Pelanggan Terisolir Saja</option>
              </select>
            </label>
            <p class="form-hint">Pilih segmen pelanggan yang ingin menerima pesan broadcast</p>
          </div>

          <!-- Template Selection -->
          <div class="section">
            <label class="form-label">
              <span class="label-text">Pilih Template</span>
            </label>
            <div v-if="templates.filter(t => t.kategori === 'broadcast').length === 0" class="empty-state">
              <p>Tidak ada template broadcast</p>
            </div>
            <div v-else class="template-list">
              <button 
                v-for="tpl in templates.filter(t => t.kategori === 'broadcast')" 
                :key="tpl.id"
                class="template-item"
                :class="{ active: broadcastForm.template?.id === tpl.id }"
                @click="broadcastForm.template = tpl; broadcastForm.message = tpl.isi_pesan"
              >
                <div class="template-item-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
                  </svg>
                </div>
                <div class="template-item-content">
                  <p class="template-item-name">{{ tpl.nama_template }}</p>
                </div>
              </button>
            </div>
          </div>

          <!-- Message Editor -->
          <div class="section">
            <label class="form-label">
              <span class="label-text">Isi Pesan</span>
            </label>
            <textarea 
              v-model="broadcastForm.message" 
              class="message-textarea"
              placeholder="Tulis pesan broadcast Anda..."
            ></textarea>
            <p class="form-hint">{{ broadcastForm.message.length }} / 4096 karakter</p>
          </div>

          <!-- Send Button -->
          <button @click="sendBroadcast" class="btn-send" :disabled="isBroadcasting || !broadcastForm.message.trim()">
            <svg v-if="!isBroadcasting" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
            <svg v-else class="spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="1"></circle>
              <path d="M12 1v6m0 6v4"></path>
              <path d="M4.22 4.22l4.24 4.24m5.08 5.08l4.24 4.24"></path>
            </svg>
            {{ isBroadcasting ? 'Mengirim...' : 'Kirim Broadcast' }}
          </button>
        </div>

        <div class="pane-right">
          <!-- Broadcast Preview -->
          <div class="section preview-section" style="display: flex; flex-direction: column; height: 100%; padding: 0; overflow: hidden;">
            <div class="section-header" style="padding: 20px; border-bottom: 1px solid var(--border-light);">
              <h3 class="section-title">Pratinjau Pesan</h3>
            </div>
            
            <div class="chat-preview-container">
              <div class="chat-header">
                <div class="chat-back">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="19" y1="12" x2="5" y2="12"></line>
                    <polyline points="12 19 5 12 12 5"></polyline>
                  </svg>
                </div>
                <div class="chat-avatar">B</div>
                <div class="chat-info">
                  <h4>Budi Santoso</h4>
                  <p>online</p>
                </div>
                <div class="chat-menu">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="5" r="1"></circle>
                    <circle cx="12" cy="12" r="1"></circle>
                    <circle cx="12" cy="19" r="1"></circle>
                  </svg>
                </div>
              </div>

              <div class="chat-body">
                <!-- Incoming Message -->
                <div class="message-group incoming">
                  <div class="chat-bubble incoming-bubble">
                    <span>Halo, apa kabar?</span>
                  </div>
                  <div class="message-time">10:42</div>
                </div>

                <div class="date-divider">Hari ini</div>

                <!-- Outgoing Message -->
                <div class="message-group outgoing">
                  <div class="chat-bubble outgoing-bubble">
                    <div v-html="broadcastPreviewText"></div>
                  </div>
                  <div class="message-time">10:45 
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.46 6.46l-1.41-1.41L9 13.59V2H7v15h2v-2.59l8.46-8.46z"></path>
                    </svg>
                  </div>
                </div>
              </div>

              <div class="chat-input-area">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12" y2="8"></line>
                </svg>
                <div class="input-placeholder">Ketik pesan</div>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                  <path d="M16.6915026,12.4744748 L3.50612381,13.2599618 C3.19218622,13.2599618 3.03521743,13.4170592 3.03521743,13.5741566 L1.15159189,20.0151496 C0.8376543,20.8006365 0.99,21.89 1.77946707,22.52 C2.41,22.99 3.50612381,23.1 4.13399899,22.8429026 L21.714504,14.0454487 C22.6563168,13.5741566 23.1272231,12.6315722 22.9702544,11.6889879 L4.13399899,1.16346272 C3.34915502,0.9 2.40734225,0.9 1.77946707,1.4429026 C0.994623095,2.0605983 0.837654326,3.0031827 1.15159189,3.98776711 L3.03521743,10.4287602 C3.03521743,10.5858575 3.34915502,10.7429549 3.50612381,10.7429549 L16.6915026,11.5284418 C16.6915026,11.5284418 17.1624089,11.5284418 17.1624089,12.0013721 C17.1624089,12.4744748 16.6915026,12.4744748 16.6915026,12.4744748 Z"></path>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { apiService as api } from '../../services/api';

const activeTab = ref('template');
const textareaRef = ref(null);

const waStatus = ref({
  isReady: false,
  qrCode: null,
  status: 'disconnected'
});

const templates = ref([]);
const selectedTemplate = ref(null);

const broadcastForm = ref({
  targets: 'all',
  template: null,
  message: ''
});
const isBroadcasting = ref(false);

let statusInterval = null;

onMounted(async () => {
  fetchTemplates();
  checkStatus();
  statusInterval = setInterval(checkStatus, 5000);
});

onUnmounted(() => {
  if (statusInterval) clearInterval(statusInterval);
});

const fetchTemplates = async () => {
  try {
    const res = await api.getWaTemplates();
    if (res.success) {
      templates.value = res.data;
      if (res.data.length > 0 && !selectedTemplate.value) {
        selectedTemplate.value = res.data[0];
      }
    }
  } catch (err) {
    console.error('Fetch templates error', err);
  }
};

const checkStatus = async () => {
  try {
    const res = await api.getWhatsAppStatus();
    if (res.success) {
      waStatus.value = res.data;
    }
  } catch (err) {
    console.error('WA Status Error', err);
  }
};

const initWA = async () => {
  try {
    await api.initWhatsApp();
    checkStatus();
  } catch (err) {
    alert('Gagal inisialisasi WA: ' + err.message);
  }
};

const logoutWA = async () => {
  if(!confirm('Yakin ingin memutuskan koneksi WhatsApp?')) return;
  try {
    await api.logoutWhatsApp();
    waStatus.value = { isReady: false, qrCode: null, status: 'disconnected' };
  } catch (err) {
    alert('Gagal logout: ' + err.message);
  }
};

const insertVar = (variable) => {
  if (!selectedTemplate.value || !textareaRef.value) return;
  
  const textarea = textareaRef.value;
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const text = selectedTemplate.value.isi_pesan;
  
  selectedTemplate.value.isi_pesan = text.substring(0, start) + variable + text.substring(end);
  
  setTimeout(() => {
    textarea.focus();
    textarea.setSelectionRange(start + variable.length, start + variable.length);
  }, 10);
};

const saveTemplate = async () => {
  if (!selectedTemplate.value) return;
  try {
    const res = await api.updateWaTemplate(selectedTemplate.value.id, {
      nama_template: selectedTemplate.value.nama_template,
      isi_pesan: selectedTemplate.value.isi_pesan
    });
    if (res.success) {
      alert('Template berhasil disimpan!');
      const idx = templates.value.findIndex(t => t.id === res.data.id);
      if (idx !== -1) templates.value[idx] = res.data;
    }
  } catch (err) {
    alert('Gagal menyimpan template');
  }
};

const sendBroadcast = async () => {
  if (!broadcastForm.value.message.trim()) {
    return alert('Pesan broadcast tidak boleh kosong');
  }
  if (!confirm('Apakah Anda yakin ingin mengirim broadcast ini ke pelanggan?')) return;
  
  isBroadcasting.value = true;
  try {
    const res = await api.sendWaBroadcast({
      templateId: broadcastForm.value.template?.id,
      message: broadcastForm.value.message,
      targets: broadcastForm.value.targets
    });
    
    if (res.success) {
      alert('Broadcast sedang diproses oleh sistem di background.');
      broadcastForm.value.message = '';
      broadcastForm.value.template = null;
    } else {
      alert('Gagal: ' + res.error);
    }
  } catch (err) {
    alert('Error sending broadcast');
  } finally {
    isBroadcasting.value = false;
  }
};

const previewText = computed(() => {
  let text = selectedTemplate.value?.isi_pesan || 'Pilih template...';
  
  text = text.replace(/\{\{name\}\}/g, 'Budi Santoso');
  text = text.replace(/\{\{company\}\}/g, 'DIONIT CELL');
  text = text.replace(/\{\{invoice_number\}\}/g, 'INV-2026-001');
  text = text.replace(/\{\{package\}\}/g, 'PAKET 10MBPS');
  text = text.replace(/\{\{period\}\}/g, 'Mei 2026');
  text = text.replace(/\{\{amount\}\}/g, '150.000');
  text = text.replace(/\{\{due_date\}\}/g, '10 Mei 2026');
  text = text.replace(/\{\{payment_link\}\}/g, 'bit.ly/pay-inv');

  text = text.replace(/\*(.*?)\*/g, '<strong>$1</strong>');
  
  return text;
});

const broadcastPreviewText = computed(() => {
  let text = broadcastForm.value.message || 'Tulis pesan...';
  
  text = text.replace(/\{\{name\}\}/g, 'Budi Santoso');
  text = text.replace(/\{\{company\}\}/g, 'DIONIT CELL');
  text = text.replace(/\{\{invoice_number\}\}/g, 'INV-2026-001');
  text = text.replace(/\{\{package\}\}/g, 'PAKET 10MBPS');
  text = text.replace(/\{\{period\}\}/g, 'Mei 2026');
  text = text.replace(/\{\{amount\}\}/g, '150.000');
  text = text.replace(/\{\{due_date\}\}/g, '10 Mei 2026');
  text = text.replace(/\{\{payment_link\}\}/g, 'bit.ly/pay-inv');

  text = text.replace(/\*(.*?)\*/g, '<strong>$1</strong>');
  
  return text;
});

</script>

<style scoped>
/* ===========================================
   WHATSAPP GATEWAY - IMPROVED DESIGN
   =========================================== */

* {
  box-sizing: border-box;
}

.wa-container {
  background: var(--bg-card);
  border-radius: 16px;
  border: 1px solid var(--border-light);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: calc(100vh - 160px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

/* =========== HEADER =========== */
.wa-header {
  padding: 24px;
  border-bottom: 1px solid var(--border-light);
  background: linear-gradient(135deg, rgba(16,185,129,0.03) 0%, rgba(16,185,129,0.01) 100%);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-icon {
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, rgba(16,185,129,0.1) 0%, rgba(16,185,129,0.05) 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #10b981;
}

.header-title {
  font-size: 24px;
  font-weight: 700;
  margin: 0;
  color: var(--text-primary);
  letter-spacing: -0.5px;
}

.header-subtitle {
  font-size: 13px;
  color: var(--text-muted);
  margin: 4px 0 0 0;
}

.header-status {
  display: flex;
  align-items: center;
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 24px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.3px;
  transition: all 0.3s ease;
}

.status-connected {
  background: rgba(16,185,129,0.1);
  color: #10b981;
  border: 1px solid rgba(16,185,129,0.2);
}

.status-disconnected {
  background: rgba(239,68,68,0.1);
  color: #ef4444;
  border: 1px solid rgba(239,68,68,0.2);
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* =========== TABS =========== */
.wa-tabs-wrapper {
  border-bottom: 1px solid var(--border-light);
  background: var(--bg-card);
  padding: 0 24px;
  overflow-x: auto;
}

.wa-tabs {
  display: flex;
  gap: 8px;
  min-width: min-content;
}

.wa-tab-button {
  background: none;
  border: none;
  padding: 16px 20px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  border-bottom: 3px solid transparent;
  transition: all 0.2s ease;
  white-space: nowrap;
  position: relative;
}

.wa-tab-button:hover {
  color: var(--text-primary);
}

.wa-tab-button.active {
  color: #10b981;
  border-bottom-color: #10b981;
}

.wa-tab-button svg {
  stroke-width: 2;
}

/* =========== CONTENT =========== */
.wa-content {
  display: flex;
  flex: 1;
  overflow: hidden;
  background: var(--bg-dark);
}

.wa-pane {
  flex: 1;
  overflow-y: auto;
  padding: 32px;
}

.wa-pane-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

.wa-pane-split {
  display: grid;
  grid-template-columns: 1fr 1.2fr 1fr;
  gap: 32px;
  padding: 32px;
  overflow-y: auto;
}

.pane-left {
  display: flex;
  flex-direction: column;
  gap: 32px;
  border-right: 1px solid var(--border-light);
  padding-right: 32px;
}

.pane-right {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding-left: 32px;
}

/* =========== CONNECTION CARDS =========== */
.connection-card {
  text-align: center;
  animation: fadeIn 0.3s ease;
}

.card-icon {
  width: 120px;
  height: 120px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;
  color: white;
}

.success-icon {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.empty-icon {
  background: linear-gradient(135deg, rgba(16,185,129,0.1) 0%, rgba(16,185,129,0.05) 100%);
  color: #10b981;
}

.card-title {
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 12px 0;
  color: var(--text-primary);
}

.card-description {
  font-size: 15px;
  color: var(--text-muted);
  margin: 0 0 28px 0;
  max-width: 480px;
  margin-left: auto;
  margin-right: auto;
  line-height: 1.6;
}

.qr-card .card-description strong {
  color: var(--text-primary);
}

.connection-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 32px;
  max-width: 420px;
  margin-left: auto;
  margin-right: auto;
  text-align: left;
}

.info-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  background: rgba(16,185,129,0.05);
  border-radius: 8px;
  font-size: 14px;
  color: var(--text-primary);
  line-height: 1.5;
}

.info-item svg {
  flex-shrink: 0;
  margin-top: 2px;
  color: #10b981;
}

.benefits-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 32px;
  max-width: 420px;
  margin-left: auto;
  margin-right: auto;
  text-align: left;
}

.benefit-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  font-size: 14px;
  color: var(--text-primary);
}

.benefit-item svg {
  color: #10b981;
  flex-shrink: 0;
}

.qr-container {
  background: white;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 24px;
  display: inline-block;
}

.qr-image {
  width: 240px;
  height: 240px;
  image-rendering: pixelated;
}

.qr-expires {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 12px;
  text-align: center;
}

/* =========== SECTIONS =========== */
.section {
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  border-radius: 12px;
  padding: 20px;
}

.preview-section {
  border: 1px solid var(--border-light);
}

.editor-panel {
  display: flex;
  flex-direction: column;
}

.editor-panel .section {
  border: 1px solid var(--border-light);
}

.section-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}

.section-header svg {
  color: #10b981;
}

.section-title {
  font-size: 15px;
  font-weight: 700;
  margin: 0;
  color: var(--text-primary);
}

.template-badge {
  margin-left: auto;
  font-size: 11px;
  font-weight: 600;
  color: #10b981;
  background: rgba(16,185,129,0.1);
  padding: 4px 10px;
  border-radius: 12px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.section-hint {
  font-size: 13px;
  color: var(--text-muted);
  margin: 0 0 12px 0;
}

.form-label {
  display: block;
  margin-bottom: 12px;
}

.label-text {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.form-select {
  width: 100%;
  padding: 10px 12px;
  background: var(--bg-dark);
  border: 1px solid var(--border-light);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 14px;
  cursor: pointer;
  transition: border-color 0.2s ease;
}

.form-select:hover {
  border-color: var(--text-muted);
}

.form-select:focus {
  outline: none;
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16,185,129,0.1);
}

.form-hint {
  font-size: 12px;
  color: var(--text-muted);
  margin: 8px 0 0 0;
}

.editor-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.editor-hint {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 8px;
}

/* =========== VARIABLES =========== */
.variables-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.variable-btn {
  background: var(--bg-dark);
  border: 1px solid var(--border-light);
  border-radius: 8px;
  padding: 10px 12px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  transition: all 0.2s ease;
  text-align: left;
}

.variable-btn:hover {
  border-color: #10b981;
  background: rgba(16,185,129,0.05);
  transform: translateY(-2px);
}

.var-name {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--text-muted);
  letter-spacing: 0.3px;
}

.var-code {
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 12px;
  color: #10b981;
  font-weight: 600;
}

/* =========== TEMPLATE LIST =========== */
.template-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.template-item {
  background: var(--bg-dark);
  border: 1px solid var(--border-light);
  border-radius: 8px;
  padding: 12px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
}

.template-item:hover {
  border-color: var(--text-muted);
  background: rgba(16,185,129,0.02);
}

.template-item.active {
  background: rgba(16,185,129,0.1);
  border-color: #10b981;
}

.template-item-icon {
  width: 40px;
  height: 40px;
  background: var(--bg-card);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  flex-shrink: 0;
}

.template-item.active .template-item-icon {
  background: rgba(16,185,129,0.2);
  color: #10b981;
}

.template-item-content {
  flex: 1;
  min-width: 0;
}

.template-item-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 4px 0;
}

.template-item-preview {
  font-size: 12px;
  color: var(--text-muted);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* =========== TEXTAREA =========== */
.message-textarea {
  width: 100%;
  min-height: 200px;
  padding: 12px;
  background: var(--bg-dark);
  border: 1px solid var(--border-light);
  border-radius: 8px;
  color: var(--text-primary);
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 13px;
  line-height: 1.6;
  resize: vertical;
  transition: border-color 0.2s ease;
}

.message-textarea:focus {
  outline: none;
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16,185,129,0.1);
}

/* =========== BUTTONS =========== */
button {
  font-family: inherit;
}

.btn-connect,
.btn-send,
.btn-save {
  width: 100%;
  padding: 12px 20px;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s ease;
  margin-top: auto;
}

.btn-connect:hover:not(:disabled),
.btn-send:hover:not(:disabled),
.btn-save:hover:not(:disabled) {
  background: #059669;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(16,185,129,0.3);
}

.btn-connect:disabled,
.btn-send:disabled,
.btn-save:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-disconnect,
.btn-retry {
  padding: 10px 20px;
  background: rgba(239,68,68,0.1);
  color: #ef4444;
  border: 1px solid rgba(239,68,68,0.2);
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s ease;
}

.btn-disconnect:hover,
.btn-retry:hover {
  background: rgba(239,68,68,0.2);
  border-color: #ef4444;
}

/* =========== ALERT =========== */
.alert {
  padding: 12px 16px;
  border-radius: 8px;
  display: flex;
  gap: 12px;
  font-size: 13px;
  line-height: 1.5;
}

.alert-warning {
  background: rgba(245,158,11,0.1);
  border: 1px solid rgba(245,158,11,0.2);
  color: #f59e0b;
}

.alert svg {
  flex-shrink: 0;
  margin-top: 2px;
}

/* =========== EMPTY STATE =========== */
.empty-state {
  padding: 40px 20px;
  text-align: center;
  color: var(--text-muted);
  font-size: 14px;
}

.empty-state.centered {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  height: 100%;
  background: var(--bg-dark);
  border-radius: 12px;
}

.empty-state.centered svg {
  opacity: 0.4;
}

/* =========== CHAT PREVIEW (TEMPLATE) =========== */
.chat-preview-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #0b141a;
  overflow: hidden;
  border-radius: 12px;
}

.chat-header {
  background: #202c33;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  flex-shrink: 0;
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
}

.chat-back {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #8696a0;
  cursor: pointer;
}

.chat-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 16px;
  flex-shrink: 0;
}

.chat-info {
  flex: 1;
}

.chat-info h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #e9edef;
}

.chat-info p {
  margin: 2px 0 0 0;
  font-size: 11px;
  color: #8696a0;
}

.chat-menu {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #8696a0;
  cursor: pointer;
}

.chat-body {
  flex: 1;
  background: #0b141a;
  padding: 16px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.date-divider {
  background: rgba(32,44,51,0.8);
  color: #8696a0;
  font-size: 11px;
  text-align: center;
  padding: 4px 8px;
  border-radius: 8px;
  align-self: center;
  margin: 8px 0;
  white-space: nowrap;
}

.message-group {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  margin-bottom: 4px;
}

.message-group.incoming {
  justify-content: flex-start;
}

.message-group.outgoing {
  justify-content: flex-end;
}

.chat-bubble {
  max-width: 80%;
  padding: 8px 12px;
  border-radius: 8px;
  line-height: 1.4;
  font-size: 13px;
  word-wrap: break-word;
  white-space: pre-wrap;
  word-break: break-word;
}

.incoming-bubble {
  background: #202c33;
  color: #e9edef;
  border-bottom-left-radius: 0;
}

.outgoing-bubble {
  background: #005c4b;
  color: #e9edef;
  border-bottom-right-radius: 0;
}

.outgoing-bubble strong {
  font-weight: 600;
  color: #ffffff;
}

.message-time {
  font-size: 10px;
  color: #8696a0;
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 0 4px;
}

.message-group.outgoing .message-time {
  color: #53bdeb;
}

.chat-input-area {
  background: #202c33;
  padding: 10px 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  border-bottom-left-radius: 12px;
  border-bottom-right-radius: 12px;
  flex-shrink: 0;
}

.chat-input-area svg:first-child,
.chat-input-area svg:last-child {
  color: #8696a0;
  cursor: pointer;
  transition: opacity 0.2s;
}

.chat-input-area svg:hover {
  opacity: 0.7;
}

.input-placeholder {
  flex: 1;
  background: #2a3942;
  border-radius: 18px;
  padding: 8px 14px;
  color: #8696a0;
  font-size: 13px;
}

/* =========== PHONE MOCKUP =========== */
.phone-mockup {
  width: 280px;
  height: 560px;
  background: #0b141a;
  border-radius: 36px;
  border: 8px solid #2a3942;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3), inset 0 0 0 2px #000;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  margin: 0 auto;
}

.phone-notch {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100px;
  height: 22px;
  background: #2a3942;
  border-bottom-left-radius: 14px;
  border-bottom-right-radius: 14px;
  z-index: 10;
}

.phone-header {
  background: #202c33;
  padding: 32px 12px 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  z-index: 5;
}

.phone-back {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #8696a0;
}

.phone-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 16px;
  flex-shrink: 0;
}

.phone-info {
  flex: 1;
}

.phone-info h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #e9edef;
}

.phone-info p {
  margin: 2px 0 0 0;
  font-size: 11px;
  color: #8696a0;
}

.phone-body {
  flex: 1;
  background: #0b141a;
  padding: 12px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.date-separator {
  background: rgba(32,44,51,0.8);
  color: #8696a0;
  font-size: 11px;
  text-align: center;
  padding: 4px 8px;
  border-radius: 8px;
  align-self: center;
  margin-bottom: 4px;
}

.message-bubble {
  background: #005c4b;
  color: #e9edef;
  padding: 8px 12px;
  border-radius: 8px;
  border-top-right-radius: 0;
  max-width: 90%;
  align-self: flex-end;
  font-size: 13px;
  line-height: 1.4;
  word-wrap: break-word;
  white-space: pre-wrap;
  box-shadow: 0 1px 0.5px rgba(11,20,26,.13);
}

.message-bubble strong {
  font-weight: 600;
  color: #ffffff;
}

.bubble-time {
  font-size: 10px;
  color: rgba(255,255,255,0.6);
  text-align: right;
  margin-top: 4px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 4px;
}

.bubble-time svg {
  width: 12px;
  height: 12px;
}

.phone-footer {
  background: #202c33;
  padding: 8px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.input-field {
  flex: 1;
  background: #2a3942;
  border-radius: 18px;
  padding: 6px 14px;
  color: #8696a0;
  font-size: 13px;
}

.send-btn {
  width: 36px;
  height: 36px;
  background: #10b981;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  cursor: pointer;
}

/* =========== ANIMATIONS =========== */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* =========== RESPONSIVE =========== */
@media (max-width: 1200px) {
  .wa-pane-split {
    grid-template-columns: 1fr;
    gap: 24px;
  }

  .pane-left {
    border-right: none;
    border-bottom: 1px solid var(--border-light);
    padding-right: 0;
    padding-bottom: 24px;
  }

  .pane-right {
    padding-left: 0;
  }

  .variables-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .wa-container {
    height: auto;
  }

  .wa-content {
    flex-direction: column;
  }

  .wa-pane {
    padding: 20px;
  }

  .wa-pane-split {
    padding: 20px;
  }

  .header-content {
    flex-direction: column;
    text-align: center;
  }

  .header-left {
    flex-direction: column;
  }

  .variables-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .phone-mockup {
    width: 240px;
    height: 480px;
    border-width: 6px;
  }
}
</style>