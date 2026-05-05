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

module.exports = router;
