import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Auto-attach JWT token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('auth_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const apiService = {
  // Routers
  getAllRouters: async () => {
    const res = await api.get('/routers');
    return res.data;
  },
  addRouter: async (data) => {
    const res = await api.post('/routers', data);
    return res.data;
  },
  updateRouter: async (id, data) => {
    const res = await api.put(`/routers/${id}`, data);
    return res.data;
  },
  deleteRouter: async (id) => {
    const res = await api.delete(`/routers/${id}`);
    return res.data;
  },
  connectRouter: async (id) => {
    const res = await api.post(`/routers/${id}/connect`);
    return res.data;
  },
  disconnectRouter: async (id) => {
    const res = await api.post(`/routers/${id}/disconnect`);
    return res.data;
  },
  testConnection: async (data) => {
    const res = await api.post('/routers/test-connection', data);
    return res.data;
  },

  // PPPoE
  getPppoeSecrets: async (id) => {
    const res = await api.get(`/routers/${id}/pppoe/secrets`);
    return res.data;
  },
  getPppoeProfiles: async (id) => {
    const res = await api.get(`/routers/${id}/pppoe/profiles`);
    return res.data;
  },
  getActivePppoe: async (id) => {
    const res = await api.get(`/routers/${id}/pppoe/active`);
    return res.data;
  },
  addPppoeProfile: async (id, data) => {
    const res = await api.post(`/routers/${id}/pppoe/profiles`, data);
    return res.data;
  },
  updatePppoeProfile: async (id, profileId, data) => {
    const res = await api.put(`/routers/${id}/pppoe/profiles/${profileId}`, data);
    return res.data;
  },
  deletePppoeProfile: async (id, profileId) => {
    const res = await api.delete(`/routers/${id}/pppoe/profiles/${profileId}`);
    return res.data;
  },
  addPppoeSecret: async (id, data) => {
    const res = await api.post(`/routers/${id}/pppoe/secrets`, data);
    return res.data;
  },
  updatePppoeSecret: async (id, secretId, data) => {
    const res = await api.put(`/routers/${id}/pppoe/secrets/${secretId}`, data);
    return res.data;
  },
  deletePppoeSecret: async (id, secretId) => {
    const res = await api.delete(`/routers/${id}/pppoe/secrets/${secretId}`);
    return res.data;
  },

  // Monitoring
  getSystemResource: async (id) => {
    const res = await api.get(`/routers/${id}/resource`);
    return res.data;
  },
  getInterfaces: async (id) => {
    const res = await api.get(`/routers/${id}/interfaces`);
    return res.data;
  },
  getInterfaceTraffic: async (id, interfaceName) => {
    const res = await api.get(`/routers/${id}/traffic/${interfaceName}`);
    return res.data;
  },
  getDashboardData: async (id, interfaceName) => {
    const params = interfaceName ? `?interface=${encodeURIComponent(interfaceName)}` : '';
    const res = await api.get(`/routers/${id}/dashboard${params}`);
    return res.data;
  },
  getIpPools: async (id) => {
    const res = await api.get(`/routers/${id}/pools`);
    return res.data;
  },

  // ======== Auth ========
  login: async (username, password) => {
    const res = await api.post('/auth/login', { username, password });
    return res.data;
  },
  getMe: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  },

  // ======== Billing Dashboard ========
  getBillingDashboard: async () => {
    const res = await api.get('/billing/dashboard');
    return res.data;
  },

  // ======== Packages ========
  getPackages: async () => {
    const res = await api.get('/packages');
    return res.data;
  },
  getPackage: async (id) => {
    const res = await api.get(`/packages/${id}`);
    return res.data;
  },
  syncPackagesFromMikrotik: async (routerId) => {
    const res = await api.post('/packages/sync-mikrotik', { router_id: routerId });
    return res.data;
  },
  addPackage: async (data) => {
    const res = await api.post('/packages', data);
    return res.data;
  },
  updatePackage: async (id, data) => {
    const res = await api.put(`/packages/${id}`, data);
    return res.data;
  },
  deletePackage: async (id) => {
    const res = await api.delete(`/packages/${id}`);
    return res.data;
  },

  // ======== Customers ========
  getCustomers: async () => {
    const res = await api.get('/customers');
    return res.data;
  },
  addCustomer: async (data) => {
    const res = await api.post('/customers', data);
    return res.data;
  },
  syncCustomersFromMikrotik: async (routerId) => {
    const res = await api.post('/customers/sync-mikrotik', { router_id: routerId });
    return res.data;
  },
  updateCustomer: async (id, data) => {

    const res = await api.put(`/customers/${id}`, data);
    return res.data;
  },
  deleteCustomer: async (id) => {
    const res = await api.delete(`/customers/${id}`);
    return res.data;
  },
  suspendCustomer: async (id) => {
    const res = await api.post(`/customers/${id}/suspend`);
    return res.data;
  },
  activateCustomer: async (id) => {
    const res = await api.post(`/customers/${id}/activate`);
    return res.data;
  },

  // ======== Invoices ========
  getInvoices: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await api.get(`/invoices${query ? '?' + query : ''}`);
    return res.data;
  },
  getInvoice: async (id) => {
    const res = await api.get(`/invoices/${id}`);
    return res.data;
  },
  generateInvoice: async (customerId) => {
    const res = await api.post('/invoices/generate', { customer_id: customerId });
    return res.data;
  },
  generateInvoicesToday: async () => {
    const res = await api.post('/invoices/generate-all');
    return res.data;
  },
  markInvoicePaid: async (id) => {
    const res = await api.post(`/invoices/${id}/mark-paid`);
    return res.data;
  },
  cancelInvoice: async (id) => {
    const res = await api.post(`/invoices/${id}/cancel`);
    return res.data;
  },
  getPaymentLink: async (id) => {
    const res = await api.post(`/invoices/${id}/payment-link`);
    return res.data;
  },
  checkInvoiceStatus: async (id) => {
    const res = await api.post(`/invoices/${id}/check-status`);
    return res.data;
  },

  // ======== WhatsApp Bot ========
  getWhatsAppStatus: async () => {
    const res = await api.get('/whatsapp/status');
    return res.data;
  },
  initWhatsApp: async () => {
    const res = await api.post('/whatsapp/init');
    return res.data;
  },
  sendTestWhatsApp: async (phone, message) => {
    const res = await api.post('/whatsapp/send-test', { phone, message });
    return res.data;
  },
  logoutWhatsApp: async () => {
    const res = await api.post('/whatsapp/logout');
    return res.data;
  },
  getWaTemplates: async () => {
    const res = await api.get('/whatsapp/templates');
    return res.data;
  },
  updateWaTemplate: async (id, data) => {
    const res = await api.put(`/whatsapp/templates/${id}`, data);
    return res.data;
  },
  sendWaBroadcast: async (data) => {
    const res = await api.post('/whatsapp/broadcast', data);
    return res.data;
  },

  // ======== Scheduler ========
  runInvoiceGeneration: async () => {
    const res = await api.post('/scheduler/run-invoices');
    return res.data;
  },
  runAutoSuspend: async () => {
    const res = await api.post('/scheduler/run-overdue');
    return res.data;
  },
  getSchedulerStatus: async () => {
    const res = await api.get('/scheduler/status');
    return res.data;
  },

  // ======== Settings ========
  getSettings: async () => {
    const res = await api.get('/settings');
    return res.data;
  },
  updateSetting: async (key, value) => {
    const res = await api.put('/settings', { key, value });
    return res.data;
  },

  // ======== Revenue ========
  getRevenueSummary: async (from, to) => {
    const res = await api.get('/revenue/summary', { params: { from, to } });
    return res.data;
  },
  getRevenueDaily: async (from, to) => {
    const res = await api.get('/revenue/daily', { params: { from, to } });
    return res.data;
  },
  getRevenueByPackage: async (from, to) => {
    const res = await api.get('/revenue/by-package', { params: { from, to } });
    return res.data;
  },
  getRevenueByMethod: async (from, to) => {
    const res = await api.get('/revenue/by-method', { params: { from, to } });
    return res.data;
  },
  getRevenueTransactions: async (filters = {}) => {
    const res = await api.get('/revenue/transactions', { params: filters });
    return res.data;
  },

  // Expenses
  getExpenses: async (params = {}) => {
    const res = await api.get('/expenses', { params });
    return res.data;
  },
  createExpense: async (data) => {
    const res = await api.post('/expenses', data);
    return res.data;
  },
  updateExpense: async (id, data) => {
    const res = await api.put(`/expenses/${id}`, data);
    return res.data;
  },
  deleteExpense: async (id) => {
    const res = await api.delete(`/expenses/${id}`);
    return res.data;
  }
};
