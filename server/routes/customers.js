const express = require('express');
const router = express.Router();
const billingService = require('../services/billing-service');
const mikrotikService = require('../services/mikrotik-service');
const { requireAuth, requireRole } = require('../middleware/auth');

// All routes require auth + admin role
router.use(requireAuth, requireRole('admin'));

// GET /api/customers
router.get('/', async (req, res) => {
  try {
    const data = await billingService.getAllCustomers();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/customers/:id
router.get('/:id', async (req, res) => {
  try {
    const data = await billingService.getCustomerById(req.params.id);
    if (!data) return res.status(404).json({ success: false, error: 'Pelanggan tidak ditemukan' });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/customers
router.post('/', async (req, res) => {
  try {
    const { name, phone, address, pppoe_username, pppoe_password, router_id, package_id, join_date, notes } = req.body;
    
    if (!name || !phone || !pppoe_username || !pppoe_password || !router_id || !package_id) {
      return res.json({ success: false, error: 'Data tidak lengkap' });
    }

    // Get package info for MikroTik profile
    const pkg = await billingService.getPackageById(package_id);
    if (!pkg) return res.json({ success: false, error: 'Paket tidak ditemukan' });

    // Create PPPoE secret in MikroTik
    try {
      await mikrotikService.addPppoeSecret(router_id, {
        name: pppoe_username,
        password: pppoe_password,
        profile: pkg.pppoe_profile,
        service: 'pppoe'
      });
    } catch (mkErr) {
      // If MikroTik error, still allow adding if it's a duplicate
      if (!mkErr.message.includes('already')) {
        return res.json({ success: false, error: `MikroTik error: ${mkErr.message}` });
      }
    }

    // Save to database
    const customerId = await billingService.createCustomer({
      name, phone, address, pppoe_username, router_id, package_id, join_date, notes
    });

    res.json({ success: true, id: customerId, message: `Pelanggan berhasil ditambahkan. Login: ${pppoe_username} / ${phone.slice(-6)}` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/customers/:id
router.put('/:id', async (req, res) => {
  try {
    await billingService.updateCustomer(req.params.id, req.body);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/customers/:id
router.delete('/:id', async (req, res) => {
  try {
    const customer = await billingService.getCustomerById(req.params.id);
    if (!customer) return res.status(404).json({ success: false, error: 'Pelanggan tidak ditemukan' });

    // Remove PPPoE secret from MikroTik
    try {
      const secrets = await mikrotikService.getPppoeSecrets(customer.router_id);
      const secret = secrets.find(s => s.name === customer.pppoe_username);
      if (secret) {
        await mikrotikService.deletePppoeSecret(customer.router_id, secret['.id']);
      }
    } catch (mkErr) {
      console.error('[Customer] Failed to remove PPPoE secret:', mkErr.message);
    }

    await billingService.deleteCustomer(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/customers/:id/suspend
router.post('/:id/suspend', async (req, res) => {
  try {
    const customer = await billingService.getCustomerById(req.params.id);
    if (!customer) return res.status(404).json({ success: false, error: 'Tidak ditemukan' });

    // Disable PPPoE secret in MikroTik
    try {
      const secrets = await mikrotikService.getPppoeSecrets(customer.router_id);
      const secret = secrets.find(s => s.name === customer.pppoe_username);
      if (secret) {
        await mikrotikService.getClient(customer.router_id).write('/ppp/secret/set', {
          '.id': secret['.id'],
          disabled: 'yes'
        });
      }
    } catch (mkErr) {
      console.error('[Customer] Failed to disable PPPoE:', mkErr.message);
    }

    await billingService.suspendCustomer(req.params.id);
    res.json({ success: true, message: 'Pelanggan di-suspend' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/customers/:id/activate
router.post('/:id/activate', async (req, res) => {
  try {
    const customer = await billingService.getCustomerById(req.params.id);
    if (!customer) return res.status(404).json({ success: false, error: 'Tidak ditemukan' });

    // Enable PPPoE secret in MikroTik
    try {
      const secrets = await mikrotikService.getPppoeSecrets(customer.router_id);
      const secret = secrets.find(s => s.name === customer.pppoe_username);
      if (secret) {
        await mikrotikService.getClient(customer.router_id).write('/ppp/secret/set', {
          '.id': secret['.id'],
          disabled: 'no'
        });
      }
    } catch (mkErr) {
      console.error('[Customer] Failed to enable PPPoE:', mkErr.message);
    }

    await billingService.activateCustomer(req.params.id);
    res.json({ success: true, message: 'Pelanggan diaktifkan' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/customers/sync-mikrotik
router.post('/sync-mikrotik', async (req, res) => {
  try {
    const { router_id } = req.body;
    if (!router_id) return res.json({ success: false, error: 'Pilih router' });

    if (!mikrotikService.isConnected(router_id)) {
      return res.json({ success: false, error: 'Router tidak terkoneksi. Sambungkan dulu di menu MikroTik Router.' });
    }

    // 1. Get all secrets from MikroTik
    const secrets = await mikrotikService.getPppoeSecrets(router_id);
    
    // 2. Get all packages from DB to match profiles
    const packages = await billingService.getAllPackages();

    // 3. Run sync
    const result = await billingService.syncCustomersFromRouter(router_id, secrets, packages);

    res.json({ 
      success: true, 
      message: `Sinkronisasi selesai. ${result.synced} pelanggan baru ditambahkan, ${result.ignored} dilewati.`,
      data: result
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

