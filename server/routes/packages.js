const express = require('express');
const router = express.Router();
const billingService = require('../services/billing-service');
const { requireAuth, requireRole } = require('../middleware/auth');

// All routes require auth + admin role
router.use(requireAuth, requireRole('admin'));

// GET /api/packages
router.get('/', async (req, res) => {
  try {
    const data = await billingService.getAllPackages();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/packages
router.post('/', async (req, res) => {
  try {
    const id = await billingService.createPackage(req.body);
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/packages/:id
router.put('/:id', async (req, res) => {
  try {
    await billingService.updatePackage(req.params.id, req.body);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/packages/:id
router.delete('/:id', async (req, res) => {
  try {
    await billingService.deletePackage(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

const mikrotikService = require('../services/mikrotik-service');

// ...

// POST /api/packages/sync-mikrotik
router.post('/sync-mikrotik', async (req, res) => {
  try {
    const { router_id } = req.body;
    if (!router_id) return res.json({ success: false, error: 'Pilih router' });

    if (!mikrotikService.isConnected(router_id)) {
      return res.json({ success: false, error: 'Router tidak terkoneksi.' });
    }

    const profiles = await mikrotikService.getPppoeProfiles(router_id);
    const result = await billingService.syncPackagesFromRouter(profiles);

    res.json({ 
      success: true, 
      message: `Sinkronisasi selesai. ${result.synced} paket baru ditambahkan, ${result.ignored} dilewati.`,
      data: result
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
