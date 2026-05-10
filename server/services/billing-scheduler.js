/**
 * Billing Scheduler Service
 * Handles automated billing tasks using node-cron:
 * - Auto-generate invoices on billing dates
 * - Auto-suspend overdue customers
 * - Auto-mark overdue invoices
 */

const cron = require('node-cron');
const billingService = require('./billing-service');

class BillingScheduler {
  constructor() {
    this.jobs = {};
    this.mikrotikService = null;
    this.whatsappBot = null;
  }

  /**
   * Parse HH:MM into a node-cron expression (MM HH * * *)
   */
  timeToCron(timeString) {
    if (!timeString || !timeString.includes(':')) return null;
    const [hh, mm] = timeString.split(':');
    return `${parseInt(mm)} ${parseInt(hh)} * * *`;
  }

  /**
   * Stop all current jobs
   */
  stopJobs() {
    for (const key in this.jobs) {
      if (this.jobs[key]) {
        this.jobs[key].stop();
      }
    }
    this.jobs = {};
  }

  /**
   * Initialize scheduler with required services
   */
  async init(mikrotikService, whatsappBot = null) {
    this.mikrotikService = mikrotikService;
    this.whatsappBot = whatsappBot;
    await this.loadSchedules();
  }

  /**
   * Reload schedules from settings and restart jobs
   */
  async reloadSchedules() {
    console.log('[Scheduler] Reloading schedules...');
    this.stopJobs();
    await this.loadSchedules();
  }

  /**
   * Load schedules from DB and start node-cron
   */
  async loadSchedules() {
    const timeGenerate = await billingService.getSetting('schedule_generate_invoice') || '00:05';
    const timeOverdue = await billingService.getSetting('schedule_check_overdue') || '08:00';
    const timeSuspend = await billingService.getSetting('schedule_auto_suspend') || '09:00';
    const timeReminder = await billingService.getSetting('schedule_send_reminders') || '10:00';

    // ─── Job 1: Auto-generate invoices ───
    this.jobs.generateInvoices = cron.schedule(this.timeToCron(timeGenerate), async () => {
      console.log('[Scheduler] Running: Auto-generate invoices...');
      await this.runInvoiceGeneration();
    }, { timezone: 'Asia/Jakarta' });

    // ─── Job 2: Check overdue invoices ───
    this.jobs.checkOverdue = cron.schedule(this.timeToCron(timeOverdue), async () => {
      console.log('[Scheduler] Running: Check overdue invoices...');
      await this.runOverdueCheck();
    }, { timezone: 'Asia/Jakarta' });

    // ─── Job 3: Auto-suspend overdue customers ───
    this.jobs.autoSuspend = cron.schedule(this.timeToCron(timeSuspend), async () => {
      console.log('[Scheduler] Running: Auto-suspend overdue customers...');
      await this.runAutoSuspend();
    }, { timezone: 'Asia/Jakarta' });

    // ─── Job 4: Send payment reminders ───
    this.jobs.sendReminders = cron.schedule(this.timeToCron(timeReminder), async () => {
      console.log('[Scheduler] Running: Send payment reminders...');
      await this.runPaymentReminders();
    }, { timezone: 'Asia/Jakarta' });

    console.log(`[Scheduler] Jobs scheduled (WIB) - Generate: ${timeGenerate}, Overdue: ${timeOverdue}, Suspend: ${timeSuspend}, Reminders: ${timeReminder}`);
  }

  /**
   * Job 1: Generate invoices for customers whose billing date is today
   */
  async runInvoiceGeneration() {
    try {
      const customers = await billingService.getCustomersDueTodayForBilling();
      console.log(`[Scheduler] Found ${customers.length} customers due for billing today`);

      let generated = 0;
      let failed = 0;

      for (const customer of customers) {
        try {
          const invoice = await billingService.createInvoice(customer.id);
          generated++;
          console.log(`[Scheduler] Invoice ${invoice.invoiceNumber} created for ${customer.name}`);

          // Send WhatsApp notification if bot is available
          if (this.whatsappBot) {
            await this.sendInvoiceNotification(customer, invoice);
          }
        } catch (err) {
          // Skip if invoice already exists for this month
          if (err.message.includes('sudah ada')) {
            continue;
          }
          failed++;
          console.error(`[Scheduler] Failed to generate invoice for ${customer.name}: ${err.message}`);
          await billingService.addSchedulerLog(customer.id, 'generate_invoice', err.message, false, err.message);
        }
      }

      console.log(`[Scheduler] Invoice generation complete: ${generated} generated, ${failed} failed`);
    } catch (err) {
      console.error('[Scheduler] Invoice generation error:', err.message);
    }
  }

  /**
   * Job 2: Mark pending invoices as overdue if past due date
   */
  async runOverdueCheck() {
    try {
      // Get invoices that are pending and past due_date
      const overdueInvoices = await billingService.getOverdueInvoices(0); // 0 grace days for marking
      console.log(`[Scheduler] Found ${overdueInvoices.length} overdue invoices`);

      for (const inv of overdueInvoices) {
        try {
          await billingService.markInvoiceOverdue(inv.id);
          await billingService.addSchedulerLog(inv.customer_id, 'mark_overdue', `Invoice ${inv.invoice_number} marked overdue`);
          console.log(`[Scheduler] Invoice ${inv.invoice_number} marked OVERDUE for ${inv.customer_name}`);
        } catch (err) {
          console.error(`[Scheduler] Failed to mark overdue: ${err.message}`);
        }
      }
    } catch (err) {
      console.error('[Scheduler] Overdue check error:', err.message);
    }
  }

  /**
   * Job 3: Suspend customers with invoices overdue beyond grace period
   */
  async runAutoSuspend() {
    try {
      const autoSuspendEnabled = await billingService.getSetting('auto_suspend');
      if (autoSuspendEnabled === 'false') {
        console.log('[Scheduler] Auto-suspend is disabled in settings, skipping');
        return;
      }

      const graceDays = parseInt(await billingService.getSetting('billing_grace_days') || '3');
      const overdueInvoices = await billingService.getOverdueInvoices(graceDays);
      console.log(`[Scheduler] Found ${overdueInvoices.length} invoices overdue beyond ${graceDays} days grace period`);

      for (const inv of overdueInvoices) {
        try {
          // Skip if customer is already suspended
          const customer = await billingService.getCustomerById(inv.customer_id);
          if (!customer || customer.status === 'suspended') continue;

          // Disable PPPoE secret on MikroTik
          if (this.mikrotikService && this.mikrotikService.isConnected(customer.router_id)) {
            try {
              const secrets = await this.mikrotikService.getPppoeSecrets(customer.router_id);
              const secret = secrets.find(s => s.name === customer.pppoe_username);
              if (secret) {
                await this.mikrotikService.getClient(customer.router_id).write('/ppp/secret/set', {
                  '.id': secret['.id'],
                  disabled: 'yes'
                });
                console.log(`[Scheduler] PPPoE ${customer.pppoe_username} disabled on router ${customer.router_id}`);
              }
            } catch (mkErr) {
              console.error(`[Scheduler] MikroTik disable failed: ${mkErr.message}`);
            }
          }

          // Update customer status in DB
          await billingService.suspendCustomer(inv.customer_id);
          await billingService.addSchedulerLog(inv.customer_id, 'auto_suspend',
            `Suspended: Invoice ${inv.invoice_number} overdue ${graceDays}+ days`);

          console.log(`[Scheduler] Customer ${customer.name} SUSPENDED (Invoice ${inv.invoice_number})`);

          // Send WhatsApp notification
          if (this.whatsappBot) {
            await this.sendSuspendNotification(customer, inv);
          }
        } catch (err) {
          console.error(`[Scheduler] Suspend failed for customer ${inv.customer_id}: ${err.message}`);
          await billingService.addSchedulerLog(inv.customer_id, 'auto_suspend', err.message, false, err.message);
        }
      }
    } catch (err) {
      console.error('[Scheduler] Auto-suspend error:', err.message);
    }
  }

  /**
   * Job 4: Send payment reminders for pending invoices
   */
  async runPaymentReminders() {
    if (!this.whatsappBot) return;

    try {
      const pendingInvoices = await billingService.getInvoices({ status: 'pending' });
      console.log(`[Scheduler] Sending reminders for ${pendingInvoices.length} pending invoices`);

      for (const inv of pendingInvoices) {
        try {
          const dueDate = new Date(inv.due_date);
          const now = new Date();
          const daysUntilDue = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));

          // Only send reminders at specific intervals: 3 days before, 1 day before, on due date
          if (daysUntilDue === 3 || daysUntilDue === 1 || daysUntilDue === 0) {
            await this.sendReminderNotification(inv, daysUntilDue);
          }
        } catch (err) {
          console.error(`[Scheduler] Reminder failed for ${inv.invoice_number}: ${err.message}`);
        }
      }
    } catch (err) {
      console.error('[Scheduler] Payment reminders error:', err.message);
    }
  }

  // ─── WhatsApp Message Builders ───
  
  async getTemplate(code) {
    try {
      const [rows] = await billingService.pool.execute(
        'SELECT isi_pesan FROM wa_templates WHERE kode_template = ?', 
        [code]
      );
      return rows.length ? rows[0].isi_pesan : null;
    } catch (err) {
      console.error(`[Scheduler] Failed to get template ${code}:`, err.message);
      return null;
    }
  }

  parseTemplate(text, data) {
    if (!text) return '';
    let parsed = text;
    Object.keys(data).forEach(key => {
      const placeholder = new RegExp(`{{${key}}}`, 'g');
      parsed = parsed.replace(placeholder, data[key]);
    });
    return parsed;
  }

  async sendInvoiceNotification(customer, invoice) {
    const portalUrl = process.env.PORTAL_URL || 'http://localhost:5173';
    const companyName = await billingService.getSetting('company_name') || 'DIONIT CELL';
    
    let template = await this.getTemplate('tagihan_baru');
    
    const data = {
      name: customer.name,
      company: companyName,
      invoice_number: invoice.invoiceNumber,
      package: customer.package_name,
      period: `${new Date(invoice.periodStart).toLocaleDateString('id-ID', {month:'long'})} ${new Date(invoice.periodStart).getFullYear()}`,
      amount: Number(invoice.amount).toLocaleString('id-ID'),
      due_date: new Date(invoice.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
      payment_link: portalUrl
    };

    const message = template ? this.parseTemplate(template, data) : 
      `🧾 *TAGIHAN INTERNET ${companyName}*\n\nHalo *${customer.name}*,\nTagihan Anda: *${invoice.invoiceNumber}* sebesar *Rp ${data.amount}*.\nJatuh tempo: *${data.due_date}*.\nBayar di: ${portalUrl}`;

    try {
      await this.whatsappBot.sendMessage(customer.phone, message);
      console.log(`[Scheduler] Invoice WA sent to ${customer.name} (${customer.phone})`);
    } catch (err) {
      console.error(`[Scheduler] WA send failed: ${err.message}`);
    }
  }

  async sendReminderNotification(invoice, daysUntilDue) {
    const companyName = await billingService.getSetting('company_name') || 'DIONIT CELL';
    const portalUrl = process.env.PORTAL_URL || 'http://localhost:5173';
    
    let template = await this.getTemplate('reminder_isolir');
    
    const data = {
      name: invoice.customer_name,
      company: companyName,
      invoice_number: invoice.invoice_number,
      amount: Number(invoice.amount).toLocaleString('id-ID'),
      due_date: new Date(invoice.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
      payment_link: portalUrl
    };

    const message = template ? this.parseTemplate(template, data) : 
      `🔔 *PENGINGAT PEMBAYARAN*\nHalo *${invoice.customer_name}*,\nTagihan *${invoice.invoice_number}* sebesar *Rp ${data.amount}* belum dibayar.\nJatuh tempo: *${data.due_date}*.\nBayar di: ${portalUrl}`;

    try {
      await this.whatsappBot.sendMessage(invoice.customer_phone, message);
    } catch (err) {
      console.error(`[Scheduler] Reminder WA failed: ${err.message}`);
    }
  }

  async sendSuspendNotification(customer, invoice) {
    const companyName = await billingService.getSetting('company_name') || 'DIONIT CELL';
    const portalUrl = process.env.PORTAL_URL || 'http://localhost:5173';

    // We don't have a specific suspend template in SQL yet, using reminder as fallback or hardcoded
    const message = `🚫 *LAYANAN INTERNET DIISOLIR*\n\n` +
      `Halo *${customer.name}*,\n` +
      `Layanan internet Anda telah *diisolir* karena tagihan melewati batas waktu pembayaran.\n\n` +
      `📋 No. Invoice: *${invoice.invoice_number}*\n` +
      `💰 Total: *Rp ${Number(invoice.amount).toLocaleString('id-ID')}*\n\n` +
      `Segera lakukan pembayaran untuk mengaktifkan kembali layanan:\n` +
      `🔗 ${portalUrl}\n\n` +
      `_${companyName}_`;

    try {
      await this.whatsappBot.sendMessage(customer.phone, message);
    } catch (err) {
      console.error(`[Scheduler] Suspend WA failed: ${err.message}`);
    }
  }

  /**
   * Stop all scheduled jobs
   */
  stop() {
    Object.values(this.jobs).forEach(job => job.stop());
    console.log('[Scheduler] All jobs stopped');
  }

  /**
   * Get status of all jobs
   */
  getStatus() {
    return Object.keys(this.jobs).map(name => ({
      name,
      running: this.jobs[name].running || false
    }));
  }
}

module.exports = new BillingScheduler();
