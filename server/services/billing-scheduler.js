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
   * Initialize scheduler with required services
   */
  init(mikrotikService, whatsappBot = null) {
    this.mikrotikService = mikrotikService;
    this.whatsappBot = whatsappBot;

    // ─── Job 1: Auto-generate invoices every day at 00:05 ───
    this.jobs.generateInvoices = cron.schedule('5 0 * * *', async () => {
      console.log('[Scheduler] Running: Auto-generate invoices...');
      await this.runInvoiceGeneration();
    }, { timezone: 'Asia/Jakarta' });

    // ─── Job 2: Check overdue invoices every day at 08:00 ───
    this.jobs.checkOverdue = cron.schedule('0 8 * * *', async () => {
      console.log('[Scheduler] Running: Check overdue invoices...');
      await this.runOverdueCheck();
    }, { timezone: 'Asia/Jakarta' });

    // ─── Job 3: Auto-suspend overdue customers every day at 09:00 ───
    this.jobs.autoSuspend = cron.schedule('0 9 * * *', async () => {
      console.log('[Scheduler] Running: Auto-suspend overdue customers...');
      await this.runAutoSuspend();
    }, { timezone: 'Asia/Jakarta' });

    // ─── Job 4: Send payment reminders at 10:00 daily ───
    this.jobs.sendReminders = cron.schedule('0 10 * * *', async () => {
      console.log('[Scheduler] Running: Send payment reminders...');
      await this.runPaymentReminders();
    }, { timezone: 'Asia/Jakarta' });

    console.log('[Scheduler] All billing jobs scheduled (Asia/Jakarta timezone)');
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

  async sendInvoiceNotification(customer, invoice) {
    const portalUrl = process.env.PORTAL_URL || 'http://localhost:5173';
    const companyName = await billingService.getSetting('company_name') || 'DIONIT CELL';
    
    const message = `🧾 *TAGIHAN INTERNET ${companyName}*\n\n` +
      `Halo *${customer.name}*,\n` +
      `Tagihan internet Anda telah terbit.\n\n` +
      `📋 No. Invoice: *${invoice.invoiceNumber}*\n` +
      `💰 Total: *Rp ${Number(invoice.amount).toLocaleString('id-ID')}*\n` +
      `📅 Jatuh Tempo: *${new Date(invoice.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}*\n\n` +
      `Segera lakukan pembayaran pada link berikut:\n` +
      `🔗 ${portalUrl}\n\n` +
      `Pastikan tetap terhubung dalam jaringan WiFi Anda untuk melakukan pembayaran.\n\n` +
      `Terima kasih 🙏\n_${companyName}_`;

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
    
    let urgency = '';
    if (daysUntilDue === 0) urgency = '⚠️ *HARI INI JATUH TEMPO!*';
    else if (daysUntilDue === 1) urgency = '⏰ *BESOK JATUH TEMPO!*';
    else urgency = `📅 *${daysUntilDue} hari lagi jatuh tempo*`;

    const message = `🔔 *PENGINGAT PEMBAYARAN*\n${urgency}\n\n` +
      `Halo *${invoice.customer_name}*,\n` +
      `Tagihan internet Anda belum dibayar.\n\n` +
      `📋 No. Invoice: *${invoice.invoice_number}*\n` +
      `💰 Total: *Rp ${Number(invoice.amount).toLocaleString('id-ID')}*\n` +
      `📅 Jatuh Tempo: *${new Date(invoice.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}*\n\n` +
      `Bayar sekarang:\n🔗 ${portalUrl}\n\n` +
      `_Abaikan jika sudah membayar._\n_${companyName}_`;

    try {
      await this.whatsappBot.sendMessage(invoice.customer_phone, message);
    } catch (err) {
      console.error(`[Scheduler] Reminder WA failed: ${err.message}`);
    }
  }

  async sendSuspendNotification(customer, invoice) {
    const companyName = await billingService.getSetting('company_name') || 'DIONIT CELL';
    const portalUrl = process.env.PORTAL_URL || 'http://localhost:5173';

    const message = `🚫 *LAYANAN INTERNET DIISOLIR*\n\n` +
      `Halo *${customer.name}*,\n` +
      `Layanan internet Anda telah *diisolir* karena tagihan melewati batas waktu pembayaran.\n\n` +
      `📋 No. Invoice: *${invoice.invoice_number}*\n` +
      `💰 Total: *Rp ${Number(invoice.amount).toLocaleString('id-ID')}*\n\n` +
      `Segera lakukan pembayaran untuk mengaktifkan kembali layanan:\n` +
      `🔗 ${portalUrl}\n\n` +
      `Layanan akan *otomatis aktif* setelah pembayaran dikonfirmasi.\n\n` +
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
