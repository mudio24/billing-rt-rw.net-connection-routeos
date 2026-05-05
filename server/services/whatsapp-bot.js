/**
 * WhatsApp Bot Service
 * Uses whatsapp-web.js for sending billing notifications
 * Generates QR code for initial pairing
 */

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const path = require('path');

class WhatsAppBot {
  constructor() {
    this.client = null;
    this.isReady = false;
    this.qrCodeDataUrl = null;
    this.status = 'disconnected'; // disconnected, qr_pending, authenticated, ready
    this.lastError = null;
  }

  /**
   * Initialize the WhatsApp client
   */
  async init() {
    if (this.client) {
      console.log('[WhatsApp] Client already initialized');
      return;
    }

    console.log('[WhatsApp] Initializing bot...');

    this.client = new Client({
      authStrategy: new LocalAuth({
        dataPath: path.join(__dirname, '..', '..', '.wwebjs_auth')
      }),
      puppeteer: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--disable-gpu'
        ]
      }
    });

    // QR Code event
    this.client.on('qr', async (qr) => {
      this.status = 'qr_pending';
      this.qrCodeDataUrl = await qrcode.toDataURL(qr);
      console.log('[WhatsApp] QR Code generated. Scan with WhatsApp to authenticate.');
    });

    // Authenticated
    this.client.on('authenticated', () => {
      this.status = 'authenticated';
      console.log('[WhatsApp] Authenticated successfully');
    });

    // Ready
    this.client.on('ready', () => {
      this.isReady = true;
      this.status = 'ready';
      this.qrCodeDataUrl = null;
      console.log('[WhatsApp] Bot is ready and connected!');
    });

    // Disconnected
    this.client.on('disconnected', (reason) => {
      this.isReady = false;
      this.status = 'disconnected';
      this.lastError = reason;
      console.log(`[WhatsApp] Disconnected: ${reason}`);
    });

    // Auth failure
    this.client.on('auth_failure', (msg) => {
      this.isReady = false;
      this.status = 'disconnected';
      this.lastError = msg;
      console.error(`[WhatsApp] Auth failure: ${msg}`);
    });

    try {
      await this.client.initialize();
    } catch (err) {
      this.lastError = err.message;
      console.error(`[WhatsApp] Init error: ${err.message}`);
    }
  }

  /**
   * Send a message to a phone number
   * @param {string} phone - Phone number (format: 628xxxx)
   * @param {string} message - Message text (supports WhatsApp formatting)
   */
  async sendMessage(phone, message) {
    if (!this.isReady) {
      throw new Error('WhatsApp bot is not ready. Please scan QR code first.');
    }

    // Normalize phone number
    let number = phone.toString().replace(/[^0-9]/g, '');
    
    // Convert 08xx to 628xx
    if (number.startsWith('0')) {
      number = '62' + number.substring(1);
    }
    
    // Ensure it starts with country code
    if (!number.startsWith('62')) {
      number = '62' + number;
    }

    const chatId = number + '@c.us';

    try {
      // Check if number is registered on WhatsApp
      const isRegistered = await this.client.isRegisteredUser(chatId);
      if (!isRegistered) {
        console.warn(`[WhatsApp] Number ${phone} is not registered on WhatsApp`);
        return { success: false, error: 'Nomor tidak terdaftar di WhatsApp' };
      }

      await this.client.sendMessage(chatId, message);
      console.log(`[WhatsApp] Message sent to ${phone}`);
      return { success: true };
    } catch (err) {
      console.error(`[WhatsApp] Send failed to ${phone}: ${err.message}`);
      return { success: false, error: err.message };
    }
  }

  /**
   * Get current bot status and QR code if available
   */
  getStatus() {
    return {
      status: this.status,
      isReady: this.isReady,
      qrCode: this.qrCodeDataUrl,
      lastError: this.lastError
    };
  }

  /**
   * Disconnect and cleanup
   */
  async destroy() {
    if (this.client) {
      try {
        await this.client.destroy();
      } catch (e) {
        // ignore
      }
      this.client = null;
      this.isReady = false;
      this.status = 'disconnected';
    }
  }

  /**
   * Logout (clear session) and re-init
   */
  async logout() {
    if (this.client) {
      try {
        await this.client.logout();
      } catch (e) {
        // ignore
      }
      await this.destroy();
    }
  }
}

module.exports = new WhatsAppBot();
