const express = require('express');
const router = express.Router();
const billingService = require('../services/billing-service');
const { requireAuth, requireRole } = require('../middleware/auth');

// Apply auth to all routes
router.use(requireAuth);
router.use(requireRole('admin'));

// Helper: get db pool from billing service
const getPool = () => billingService.pool;

// GET /api/expenses
router.get('/', async (req, res) => {
  try {
    const { from, to, category } = req.query;
    let query = 'SELECT * FROM expenses WHERE 1=1';
    const params = [];

    if (from) {
      query += ' AND expense_date >= ?';
      params.push(from);
    }
    if (to) {
      query += ' AND expense_date <= ?';
      params.push(to);
    }
    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    query += ' ORDER BY expense_date DESC, created_at DESC';
    const [rows] = await getPool().execute(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/expenses
router.post('/', async (req, res) => {
  try {
    const { expense_date, category, description, amount, notes } = req.body;
    const [result] = await getPool().execute(
      'INSERT INTO expenses (expense_date, category, description, amount, notes) VALUES (?, ?, ?, ?, ?)',
      [expense_date, category, description, amount, notes]
    );
    res.json({ success: true, id: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/expenses/:id
router.put('/:id', async (req, res) => {
  try {
    const { expense_date, category, description, amount, notes } = req.body;
    await getPool().execute(
      'UPDATE expenses SET expense_date = ?, category = ?, description = ?, amount = ?, notes = ? WHERE id = ?',
      [expense_date, category, description, amount, notes, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/expenses/:id
router.delete('/:id', async (req, res) => {
  try {
    await getPool().execute('DELETE FROM expenses WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
