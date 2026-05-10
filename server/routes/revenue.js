const express = require('express');
const router = express.Router();
const billingService = require('../services/billing-service');
const { requireAuth, requireRole } = require('../middleware/auth');

// Helper: default date range = current month
function getDefaultRange() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const from = `${y}-${m}-01`;
  const to = `${y}-${m}-${d}`;
  return { from, to };
}

// GET /api/revenue/summary?from=&to=
router.get('/summary', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { from, to } = { ...getDefaultRange(), ...req.query };
    const data = await billingService.getRevenueSummary(from, to);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/revenue/daily?from=&to=
router.get('/daily', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { from, to } = { ...getDefaultRange(), ...req.query };
    const data = await billingService.getRevenueDaily(from, to);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/revenue/by-package?from=&to=
router.get('/by-package', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { from, to } = { ...getDefaultRange(), ...req.query };
    const data = await billingService.getRevenueByPackage(from, to);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/revenue/by-method?from=&to=
router.get('/by-method', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { from, to } = { ...getDefaultRange(), ...req.query };
    const data = await billingService.getRevenueByMethod(from, to);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/revenue/transactions?from=&to=&status=&method=
router.get('/transactions', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const defaults = getDefaultRange();
    const filters = {
      from: req.query.from || defaults.from,
      to: req.query.to || defaults.to,
      status: req.query.status || null,
      method: req.query.method || null
    };
    const data = await billingService.getRevenueTransactions(filters);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
