const express = require('express');
const router = express.Router();
const billingService = require('../services/billing-service');
const { generateToken, requireAuth } = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.json({ success: false, error: 'Username dan password wajib diisi' });
    }

    const user = await billingService.authenticateUser(username, password);
    if (!user) {
      return res.json({ success: false, error: 'Username atau password salah' });
    }

    const token = generateToken(user);
    res.json({ success: true, token, user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await billingService.getUserById(req.user.id);
    if (!user) return res.status(404).json({ success: false, error: 'User tidak ditemukan' });

    // If pelanggan, attach customer info
    let customer = null;
    if (user.role === 'pelanggan' && user.customer_id) {
      customer = await billingService.getCustomerById(user.customer_id);
    }

    res.json({ success: true, user, customer });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
