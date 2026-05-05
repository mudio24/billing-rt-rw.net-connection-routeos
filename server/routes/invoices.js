const express = require('express');
const router = express.Router();
const billingService = require('../services/billing-service');
const xenditService = require('../services/xendit-service');
const { requireAuth, requireRole } = require('../middleware/auth');

// GET /api/invoices (admin: semua, pelanggan: miliknya)
router.get('/', requireAuth, async (req, res) => {
  try {
    const filters = {};
    
    if (req.user.role === 'pelanggan' && req.user.customerId) {
      filters.customerId = req.user.customerId;
    }
    if (req.query.status) filters.status = req.query.status;
    if (req.query.limit) filters.limit = parseInt(req.query.limit);

    const data = await billingService.getInvoices(filters);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/invoices/:id
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const invoice = await billingService.getInvoiceById(req.params.id);
    if (!invoice) return res.status(404).json({ success: false, error: 'Invoice tidak ditemukan' });

    // Pelanggan hanya bisa lihat miliknya
    if (req.user.role === 'pelanggan' && invoice.customer_id !== req.user.customerId) {
      return res.status(403).json({ success: false, error: 'Akses ditolak' });
    }

    res.json({ success: true, data: invoice });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/invoices/generate (manual generate for specific customer)
router.post('/generate', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { customer_id } = req.body;
    if (!customer_id) return res.json({ success: false, error: 'customer_id wajib diisi' });

    const invoice = await billingService.createInvoice(customer_id);
    res.json({ success: true, data: invoice });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

// POST /api/invoices/generate-all (generate for all customers due today)
router.post('/generate-all', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const customers = await billingService.getCustomersDueTodayForBilling();
    const results = [];

    for (const customer of customers) {
      try {
        const invoice = await billingService.createInvoice(customer.id);
        results.push({ customerId: customer.id, name: customer.name, success: true, invoice });
      } catch (err) {
        results.push({ customerId: customer.id, name: customer.name, success: false, error: err.message });
      }
    }

    res.json({ success: true, generated: results.filter(r => r.success).length, failed: results.filter(r => !r.success).length, details: results });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/invoices/:id/mark-paid
router.post('/:id/mark-paid', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    await billingService.markInvoicePaid(req.params.id, 'manual');
    await billingService.addPaymentLog(req.params.id, 'manual.paid', { marked_by: req.user.username });
    res.json({ success: true, message: 'Invoice ditandai lunas' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/invoices/:id/cancel
router.post('/:id/cancel', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    await billingService.cancelInvoice(req.params.id);
    res.json({ success: true, message: 'Invoice dibatalkan' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/invoices/:id/payment-link
router.post('/:id/payment-link', requireAuth, async (req, res) => {
  try {
    const invoice = await billingService.getInvoiceById(req.params.id);
    if (!invoice) return res.status(404).json({ success: false, error: 'Invoice tidak ditemukan' });

    // Pelanggan hanya bisa bayar miliknya
    if (req.user.role === 'pelanggan' && invoice.customer_id !== req.user.customerId) {
      return res.status(403).json({ success: false, error: 'Akses ditolak' });
    }

    // If already has Xendit URL, return it
    if (invoice.xendit_invoice_url) {
      return res.json({ success: true, url: invoice.xendit_invoice_url });
    }

    // Create Xendit Invoice
    console.log(`[Payment] Creating Xendit invoice for ${invoice.invoice_number}, amount: ${invoice.amount}`);
    const xenditInv = await xenditService.createInvoice({
      invoice_number: invoice.invoice_number,
      amount: invoice.amount,
      customer_name: invoice.customer_name || 'Pelanggan',
      customer_phone: invoice.customer_phone || '081200000000',
      customer_email: invoice.customer_email || null,
      period_start: invoice.period_start,
      period_end: invoice.period_end
    });

    // Update DB with Xendit invoice ID and URL
    if (xenditInv && xenditInv.invoice_url) {
      await billingService.updateInvoiceXendit(invoice.id, xenditInv.id, xenditInv.invoice_url);
      console.log(`[Payment] Xendit invoice created: ${xenditInv.invoice_url}`);
      res.json({ success: true, url: xenditInv.invoice_url });
    } else {
      console.error('[Payment] Xendit response missing invoice_url:', xenditInv);
      res.json({ success: false, error: 'Xendit tidak mengembalikan URL pembayaran' });
    }
  } catch (err) {
    console.error('[Payment] Error creating payment link:', err.message);
    res.json({ success: false, error: err.message });
  }
});

// POST /api/invoices/:id/check-status
// Fallback: cek status invoice langsung ke Xendit API
// Dipanggil saat user redirect balik dari halaman bayar Xendit
// (pola dari kasirku: checkInvoiceStatus)
router.post('/:id/check-status', requireAuth, async (req, res) => {
  try {
    const invoice = await billingService.getInvoiceById(req.params.id);
    if (!invoice) return res.json({ success: false, error: 'Invoice tidak ditemukan' });

    // Kalau sudah paid, skip
    if (invoice.status === 'paid') {
      return res.json({ success: true, status: 'paid', message: 'Invoice sudah lunas' });
    }

    // Kalau belum punya xendit_invoice_id, skip
    if (!invoice.xendit_invoice_id) {
      return res.json({ success: true, status: invoice.status, message: 'Invoice belum terhubung ke Xendit' });
    }

    // Cek langsung ke Xendit API
    const xenditStatus = await xenditService.checkInvoiceStatus(invoice.xendit_invoice_id);
    const result = xenditService.processWebhookStatus(xenditStatus);

    console.log(`[CheckStatus] Invoice ${invoice.invoice_number}: Xendit status = ${result.status}`);

    if (result.status === 'paid') {
      // Update invoice jadi paid
      await billingService.markInvoicePaid(invoice.id, `Xendit (${result.payment_method || result.payment_channel || 'online'})`);
      await billingService.addPaymentLog(invoice.id, 'xendit.check_status.paid', xenditStatus);

      // Auto-activate customer jika suspended
      const customer = await billingService.getCustomerById(invoice.customer_id);
      if (customer && customer.status === 'suspended') {
        console.log(`[CheckStatus] Auto-activating customer ${customer.name}`);
        const mikrotikService = require('../services/mikrotik-service');
        try {
          const secrets = await mikrotikService.getPppoeSecrets(customer.router_id);
          const secret = secrets.find(s => s.name === customer.pppoe_username);
          if (secret) {
            await mikrotikService.getClient(customer.router_id).write('/ppp/secret/set', {
              '.id': secret['.id'],
              disabled: 'no'
            });
          }
          await billingService.activateCustomer(customer.id);
        } catch (mkErr) {
          console.error('[CheckStatus] MikroTik activation failed:', mkErr.message);
        }
      }

      return res.json({ success: true, status: 'paid', message: 'Pembayaran berhasil terverifikasi!' });
    }

    if (result.status === 'expired') {
      await billingService.addPaymentLog(invoice.id, 'xendit.check_status.expired', xenditStatus);
      return res.json({ success: true, status: 'expired', message: 'Invoice sudah expired' });
    }

    return res.json({ success: true, status: result.status || 'pending', message: 'Pembayaran belum terdeteksi' });
  } catch (err) {
    console.error('[CheckStatus] Error:', err.message);
    res.json({ success: false, error: err.message });
  }
});

// POST /api/invoices/webhook (Public, called by Xendit)
router.post('/webhook', async (req, res) => {
  try {
    const callbackToken = req.headers['x-callback-token'];
    if (!xenditService.verifyWebhookToken(callbackToken)) {
      console.warn(`[Xendit Webhook] Invalid or missing x-callback-token`);
      return res.status(401).json({ error: 'Unauthorized callback' });
    }

    const { id, external_id, status, payment_method, paid_at } = req.body;
    
    // Log the event
    console.log(`[Xendit Webhook] Invoice ${external_id} status: ${status}`);

    // Find invoice by external_id (invoice_number)
    const invoices = await billingService.getInvoices({ invoice_number: external_id });
    if (invoices.length === 0) return res.status(404).json({ error: 'Invoice not found' });

    const invoice = invoices[0];
    await billingService.addPaymentLog(invoice.id, `xendit.${status}`, req.body);

    const result = xenditService.processWebhookStatus(req.body);

    if (result.status === 'paid') {
      await billingService.markInvoicePaid(invoice.id, `Xendit (${result.payment_method || result.payment_channel || 'online'})`);
      
      // Auto-activate customer if they were suspended
      const customer = await billingService.getCustomerById(invoice.customer_id);
      if (customer && customer.status === 'suspended') {
        console.log(`[Xendit Webhook] Auto-activating customer ${customer.name}`);
        const mikrotikService = require('../services/mikrotik-service');
        try {
          const secrets = await mikrotikService.getPppoeSecrets(customer.router_id);
          const secret = secrets.find(s => s.name === customer.pppoe_username);
          if (secret) {
            await mikrotikService.getClient(customer.router_id).write('/ppp/secret/set', {
              '.id': secret['.id'],
              disabled: 'no'
            });
          }
          await billingService.activateCustomer(customer.id);
        } catch (mkErr) {
          console.error('[Xendit Webhook] MikroTik activation failed:', mkErr.message);
        }
      }
    } else if (result.status === 'expired') {
       // Currently no 'expired' status in invoice table, but we could mark it cancelled
       // await billingService.cancelInvoice(invoice.id);
    }

    res.json({ success: true });
  } catch (err) {
    console.error('[Xendit Webhook] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

