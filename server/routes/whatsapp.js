const express = require('express');
const router = express.Router();
const whatsappBot = require('../services/whatsapp-bot');
const { requireAuth, requireRole } = require('../middleware/auth');

// GET /api/whatsapp/status
router.get('/status', requireAuth, requireRole('admin'), (req, res) => {
  const status = whatsappBot.getStatus();
  res.json({ success: true, data: status });
});

// POST /api/whatsapp/init (start WA bot and get QR code)
router.post('/init', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    await whatsappBot.init();
    // Wait a moment for QR to generate
    await new Promise(resolve => setTimeout(resolve, 3000));
    const status = whatsappBot.getStatus();
    res.json({ success: true, data: status });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

// POST /api/whatsapp/send-test
router.post('/send-test', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { phone, message } = req.body;
    if (!phone || !message) {
      return res.json({ success: false, error: 'phone dan message wajib diisi' });
    }

    const result = await whatsappBot.sendMessage(phone, message);
    res.json(result);
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

// POST /api/whatsapp/logout
router.post('/logout', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    await whatsappBot.logout();
    res.json({ success: true, message: 'WhatsApp bot logged out' });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

// ============================================
// TEMPLATES & BROADCAST
// ============================================

const billingService = require('../services/billing-service');

// GET /api/whatsapp/templates
router.get('/templates', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const templates = await billingService.getWaTemplates();
    res.json({ success: true, data: templates });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/whatsapp/templates/:id
router.put('/templates/:id', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const updated = await billingService.updateWaTemplate(req.params.id, req.body);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/whatsapp/broadcast
router.post('/broadcast', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { templateId, message, targets } = req.body;
    
    // targets could be 'all', 'active', 'suspended'
    let customers = [];
    if (targets === 'all' || targets === 'active' || targets === 'suspended') {
       const allCusts = await billingService.getCustomers();
       if (targets === 'all') customers = allCusts;
       else customers = allCusts.filter(c => c.status === targets);
    }

    if (customers.length === 0) {
      return res.json({ success: false, error: 'Tidak ada target pelanggan yang sesuai kriteria.' });
    }

    if (!whatsappBot.isReady) {
      return res.json({ success: false, error: 'WhatsApp bot belum terhubung.' });
    }

    // In a real production app, this should be a queue system.
    // For now, we process it asynchronously in the background.
    res.json({ 
      success: true, 
      message: `Broadcast sedang diproses ke ${customers.length} pelanggan.` 
    });

    // Background processing
    setTimeout(async () => {
      for (const customer of customers) {
        if (!customer.phone) continue;
        
        // Parse message variables
        let finalMessage = message
          .replace(/\{\{name\}\}/g, customer.name)
          .replace(/\{\{company\}\}/g, 'DIONIT CELL')
          // other vars might not be available in a general broadcast context 
          // unless we fetch the latest invoice, but for promo/maintenance this is enough
          ;
          
        try {
          await whatsappBot.sendMessage(customer.phone, finalMessage);
          // Wait 2-5 seconds between messages to avoid ban
          await new Promise(r => setTimeout(r, 2000 + Math.random() * 3000));
        } catch (err) {
          console.error(`[Broadcast] Failed to send to ${customer.name}: ${err.message}`);
        }
      }
      console.log(`[Broadcast] Completed sending to ${customers.length} customers.`);
    }, 1000);

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
