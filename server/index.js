const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const dbService = require('./services/router-db-service');
const mikrotikService = require('./services/mikrotik-service');
const billingService = require('./services/billing-service');
const billingScheduler = require('./services/billing-scheduler');
const whatsappBot = require('./services/whatsapp-bot');

// Route imports
const authRoutes = require('./routes/auth');
const packagesRoutes = require('./routes/packages');
const customersRoutes = require('./routes/customers');
const invoicesRoutes = require('./routes/invoices');
const whatsappRoutes = require('./routes/whatsapp');
const revenueRoutes = require('./routes/revenue');
const expensesRoutes = require('./routes/expenses');
const { requireAuth, requireRole } = require('./middleware/auth');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Listen for connection drops
mikrotikService.on('connection-lost', async (data) => {
  console.log(`[Server] Event: connection-lost for router ${data.routerId} - ${data.message}`);
  await dbService.updateConnectionStatus(data.routerId, false, data.message);
  // In a web app, we might use WebSockets to notify the client
  // For now, clients will see it on their next poll or refresh
});


// ============================================
// API ROUTES
// ============================================

// --- Router Management ---

app.get('/api/routers', async (req, res) => {
  try {
    const data = await dbService.getAllRouters();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/routers', async (req, res) => {
  try {
    const result = await dbService.addRouter(req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/routers/:id', async (req, res) => {
  try {
    const result = await dbService.updateRouter(req.params.id, req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/routers/:id', async (req, res) => {
  try {
    const id = req.params.id;
    if (mikrotikService.isConnected(id)) {
      await mikrotikService.disconnect(id);
      dbService.updateConnectionStatus(id, false, null);
    }
    const result = await dbService.deleteRouter(id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/routers/:id/connect', async (req, res) => {
  try {
    const id = req.params.id;
    const router = await dbService.getRouterById(id, true);
    if (!router) {
      return res.status(404).json({ success: false, message: 'Router tidak ditemukan' });
    }

    const config = {
      id: router.id,
      name: router.name,
      ip_address: router.ip_address,
      mac_address: router.mac_address,
      api_port: router.api_port,
      username: router.username,
      password: router.decryptedPassword || ''
    };

    const result = await mikrotikService.connect(config);
    dbService.updateConnectionStatus(id, result.success, result.success ? null : result.message);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/routers/:id/disconnect', async (req, res) => {
  try {
    const result = await mikrotikService.disconnect(req.params.id);
    dbService.updateConnectionStatus(req.params.id, false, null);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/routers/test-connection', async (req, res) => {
  try {
    const result = await mikrotikService.testConnection(req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- PPPoE Management ---

app.get('/api/routers/:id/pppoe/secrets', async (req, res) => {
  try {
    const data = await mikrotikService.getPppoeSecrets(req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

app.get('/api/routers/:id/pppoe/profiles', async (req, res) => {
  try {
    const data = await mikrotikService.getPppoeProfiles(req.params.id);
    const dbProfiles = await dbService.getPppoeProfilesFromDb(req.params.id);
    
    const enrichedData = data.map(p => {
      const dbInfo = dbProfiles[p.name] || {};
      return {
        ...p,
        price: dbInfo.price || 0,
        limit_uptime: dbInfo.limit_uptime || '',
        validity_days: dbInfo.validity_days || 0
      };
    });

    res.json({ success: true, data: enrichedData });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

app.get('/api/routers/:id/pppoe/active', async (req, res) => {
  try {
    const data = await mikrotikService.getActivePppoe(req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

app.post('/api/routers/:id/pppoe/profiles', async (req, res) => {
  try {
    await mikrotikService.addPppoeProfile(req.params.id, req.body);
    await dbService.savePppoeProfileToDb(req.params.id, req.body.name, req.body);
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

app.put('/api/routers/:id/pppoe/profiles/:profileId', async (req, res) => {
  try {
    await mikrotikService.updatePppoeProfile(req.params.id, req.params.profileId, req.body);
    await dbService.savePppoeProfileToDb(req.params.id, req.body.name, req.body);
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

app.delete('/api/routers/:id/pppoe/profiles/:profileId', async (req, res) => {
  try {
    await mikrotikService.deletePppoeProfile(req.params.id, req.params.profileId);
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

app.post('/api/routers/:id/pppoe/secrets', async (req, res) => {
  try {
    await mikrotikService.addPppoeSecret(req.params.id, req.body);
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

app.put('/api/routers/:id/pppoe/secrets/:secretId', async (req, res) => {
  try {
    await mikrotikService.updatePppoeSecret(req.params.id, req.params.secretId, req.body);
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

app.delete('/api/routers/:id/pppoe/secrets/:secretId', async (req, res) => {
  try {
    await mikrotikService.deletePppoeSecret(req.params.id, req.params.secretId);
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

// --- Monitoring ---

app.get('/api/routers/:id/resource', async (req, res) => {
  try {
    const data = await mikrotikService.getSystemResource(req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

app.get('/api/routers/:id/interfaces', async (req, res) => {
  try {
    const data = await mikrotikService.getInterfaces(req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

app.get('/api/routers/:id/traffic/:interfaceName', async (req, res) => {
  try {
    const data = await mikrotikService.getInterfaceTraffic(req.params.id, req.params.interfaceName);
    res.json({ success: true, data });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

// --- Unified Dashboard Endpoint (1 request = all data) ---
app.get('/api/routers/:id/dashboard', async (req, res) => {
  try {
    const id = req.params.id;
    const ifaceName = req.query.interface || '';

    // Only 2 API calls (with write lock, they won't collide):
    const resource = await mikrotikService.getSystemResource(id);
    
    // getInterfaceTraffic already calls /interface/print internally
    // so we reuse it + getActivePppoe
    let traffic = null;
    if (ifaceName) {
      traffic = await mikrotikService.getInterfaceTraffic(id, ifaceName);
    }

    // PPPoE active count — lightweight call
    let activePppoeCount = 0;
    try {
      const activePppoe = await mikrotikService.getActivePppoe(id);
      activePppoeCount = activePppoe.length;
    } catch {
      // non-critical, ignore
    }

    res.json({
      success: true,
      resource: resource[0] || {},
      activePppoeCount,
      traffic: traffic && traffic.length > 0 ? traffic[0] : null
    });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

app.get('/api/routers/:id/pools', async (req, res) => {
  try {
    const data = await mikrotikService.getIpPools(req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

// ============================================
// BILLING ROUTES
// ============================================
app.use('/api/auth', authRoutes);
app.use('/api/packages', packagesRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/invoices', invoicesRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/revenue', revenueRoutes);
app.use('/api/expenses', expensesRoutes);

// Settings API (admin only)
app.get('/api/settings', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const settings = await billingService.getAllSettings();
    res.json({ success: true, data: settings });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

app.put('/api/settings', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { key, value } = req.body;
    await billingService.setSetting(key, value);
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

// Scheduler manual triggers (admin)
app.post('/api/scheduler/run-invoices', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    await billingScheduler.runInvoiceGeneration();
    res.json({ success: true, message: 'Invoice generation completed' });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

app.post('/api/scheduler/run-overdue', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    await billingScheduler.runAutoSuspend();
    res.json({ success: true, message: 'Auto-suspend completed' });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

app.get('/api/scheduler/status', requireAuth, requireRole('admin'), (req, res) => {
  res.json({ success: true, data: billingScheduler.getStatus() });
});

app.post('/api/scheduler/reload', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    await billingScheduler.reloadSchedules();
    res.json({ success: true, message: 'Jadwal berhasil diperbarui dan direstart' });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

// Dashboard Stats
app.get('/api/billing/dashboard', requireAuth, async (req, res) => {
  try {
    const stats = await billingService.getDashboardStats();
    res.json({ success: true, data: stats });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

// Serve Frontend in Production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

// Start Server
async function startServer() {
  try {
    await dbService.initDatabase();
    console.log('[Server] Database initialized');

    // Init billing system
    await billingService.init(dbService.getPool());
    console.log('[Server] Billing system initialized');

    // Initialize Billing Scheduler
    await billingScheduler.init(mikrotikService, whatsappBot.isReady ? whatsappBot : null);
    console.log('[Server] Billing scheduler initialized');

    // Initialize WhatsApp Bot (optional - only if enabled)
    if (process.env.WA_ENABLED === 'true') {
      try {
        await whatsappBot.init();
        // Re-attach bot to scheduler once ready
        whatsappBot.client?.on('ready', () => {
          billingScheduler.whatsappBot = whatsappBot;
          console.log('[Server] WhatsApp bot attached to scheduler');
        });
      } catch (err) {
        console.warn('[Server] WhatsApp bot init failed (non-critical):', err.message);
      }
    } else {
      console.log('[Server] WhatsApp bot disabled (set WA_ENABLED=true in .env to enable)');
    }

    app.listen(port, () => {
      console.log(`[Server] Web server running at http://localhost:${port}`);
      autoConnectRouters();
    });
  } catch (err) {
    console.error('[Server] Failed to start:', err);
  }
}

async function autoConnectRouters() {
  console.log('[Server] Auto-connecting routers...');
  const routerConfigs = await dbService.getAllRouterConfigs();
  for (const config of routerConfigs) {
    const result = await mikrotikService.connect(config);
    dbService.updateConnectionStatus(config.id, result.success, result.success ? null : result.message);
  }
  console.log('[Server] Auto-connect finished');
}

startServer();
