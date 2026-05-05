/**
 * Xendit Payment Gateway Service
 * Menggunakan HTTP API langsung (pola dari kasirku)
 * Lebih stabil daripada xendit-node SDK
 */

const axios = require('axios');

class XenditService {
  constructor() {
    this.secretKey = null;
    this.baseUrl = 'https://api.xendit.co';
    this.webhookToken = null;
    this.initialized = false;
  }

  init() {
    this.secretKey = process.env.XENDIT_SECRET_KEY;
    this.webhookToken = process.env.XENDIT_WEBHOOK_TOKEN || '';
    this.baseUrl = process.env.XENDIT_BASE_URL || 'https://api.xendit.co';

    if (!this.secretKey) {
      console.warn('[Xendit] XENDIT_SECRET_KEY not set. Payment gateway disabled.');
      return false;
    }

    this.initialized = true;
    console.log('[Xendit] Service initialized (HTTP mode)');
    return true;
  }

  /**
   * Verify webhook callback token (dari header x-callback-token)
   */
  verifyWebhookToken(token) {
    if (!this.webhookToken) return true; // Allow all if not configured (dev mode)
    return token === this.webhookToken;
  }

  /**
   * Create invoice via Xendit REST API /v2/invoices
   * Pola dari kasirku: HTTP Basic Auth + direct POST
   */
  async createInvoice(invoiceData) {
    if (!this.initialized) this.init();
    if (!this.initialized) throw new Error('Xendit belum dikonfigurasi. Isi XENDIT_SECRET_KEY di .env');

    // Normalize phone
    let phone = (invoiceData.customer_phone || '').replace(/[^0-9]/g, '');
    if (phone.startsWith('0')) phone = '62' + phone.substring(1);
    if (!phone.startsWith('62')) phone = '62' + phone;

    const externalId = String(invoiceData.invoice_number);
    const portalUrl = process.env.PORTAL_URL || 'http://localhost:5173';

    const payload = {
      external_id: externalId,
      amount: Number(invoiceData.amount),
      payer_email: invoiceData.customer_email || 'customer@dionitcell.net',
      description: `Tagihan Internet DIONIT CELL - ${invoiceData.customer_name} (${invoiceData.period_start} s/d ${invoiceData.period_end})`,
      invoice_duration: 86400 * 3, // 3 hari
      currency: 'IDR',
      customer: {
        given_names: invoiceData.customer_name || 'Pelanggan',
        mobile_number: '+' + phone,
      },
      success_redirect_url: `${portalUrl}?payment=success&invoice=${externalId}`,
      failure_redirect_url: `${portalUrl}?payment=failed&invoice=${externalId}`,
    };

    console.log('[Xendit] Creating invoice:', externalId, 'amount:', payload.amount);

    try {
      const response = await axios.post(`${this.baseUrl}/v2/invoices`, payload, {
        auth: { username: this.secretKey, password: '' },
        timeout: 30000,
        headers: { 'Content-Type': 'application/json' }
      });

      const data = response.data;

      console.log('[Xendit] Invoice created OK:', data.id, data.invoice_url);

      return {
        id: data.id,
        invoice_url: data.invoice_url,
        external_id: data.external_id,
        status: data.status,
      };
    } catch (err) {
      const errData = err.response?.data || {};
      const msg = errData.message || err.message || 'Unknown Xendit error';
      console.error('[Xendit] Create invoice failed:', msg, errData);
      throw new Error(`Xendit: ${msg}`);
    }
  }

  /**
   * Check invoice status langsung ke Xendit API (fallback jika webhook belum masuk)
   * Pola dari kasirku: checkInvoiceStatus()
   */
  async checkInvoiceStatus(xenditInvoiceId) {
    if (!this.initialized) this.init();
    if (!this.initialized) throw new Error('Xendit belum dikonfigurasi');

    try {
      const response = await axios.get(`${this.baseUrl}/v2/invoices/${xenditInvoiceId}`, {
        auth: { username: this.secretKey, password: '' },
        timeout: 30000,
      });

      const data = response.data;

      return {
        id: data.id,
        external_id: data.external_id,
        status: data.status, // PENDING, PAID, SETTLED, EXPIRED
        payment_method: data.payment_method || null,
        payment_channel: data.payment_channel || null,
        paid_at: data.paid_at || null,
      };
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      console.error('[Xendit] Check invoice status failed:', msg);
      throw new Error(`Xendit check status: ${msg}`);
    }
  }

  /**
   * Process webhook payload (dari Xendit atau dari checkInvoiceStatus)
   * Return: { status: 'paid'|'expired'|'failed', payment_method, payment_channel }
   */
  processWebhookStatus(payload) {
    const rawStatus = (payload.status || '').toUpperCase();

    let status;
    switch (rawStatus) {
      case 'PAID':
      case 'SETTLED':
        status = 'paid';
        break;
      case 'EXPIRED':
        status = 'expired';
        break;
      default:
        status = 'failed';
    }

    return {
      status,
      payment_method: payload.payment_method || null,
      payment_channel: payload.payment_channel || null,
      paid_at: payload.paid_at || null,
      xendit_id: payload.id || null,
    };
  }
}

module.exports = new XenditService();
