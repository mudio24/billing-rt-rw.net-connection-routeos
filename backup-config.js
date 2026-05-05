/**
 * Script untuk backup konfigurasi MikroTik via API
 * Jalankan: node backup-config.js
 */
const MikrotikAPI = require('./server/services/mikrotik-api');
const fs = require('fs');

const HOST = '10.10.10.1';
const PORT = 8728;
const USER = 'admin';
const PASS = '123';

async function backupConfig() {
  const client = new MikrotikAPI({ host: HOST, port: PORT, user: USER, password: PASS, timeout: 10 });
  
  console.log(`Connecting to ${HOST}...`);
  await client.connect();
  console.log('Connected! Fetching configuration...\n');

  const sections = [
    { title: 'System Identity', cmd: '/system/identity/print' },
    { title: 'System Resource', cmd: '/system/resource/print' },
    { title: 'Interfaces', cmd: '/interface/print' },
    { title: 'Bridge', cmd: '/interface/bridge/print' },
    { title: 'Bridge Ports', cmd: '/interface/bridge/port/print' },
    { title: 'Wireless', cmd: '/interface/wireless/print' },
    { title: 'Wireless Security', cmd: '/interface/wireless/security-profiles/print' },
    { title: 'IP Addresses', cmd: '/ip/address/print' },
    { title: 'IP Pools', cmd: '/ip/pool/print' },
    { title: 'DHCP Server', cmd: '/ip/dhcp-server/print' },
    { title: 'DHCP Server Network', cmd: '/ip/dhcp-server/network/print' },
    { title: 'DHCP Client', cmd: '/ip/dhcp-client/print' },
    { title: 'IP DNS', cmd: '/ip/dns/print' },
    { title: 'IP Services', cmd: '/ip/service/print' },
    { title: 'IP Firewall Filter', cmd: '/ip/firewall/filter/print' },
    { title: 'IP Firewall NAT', cmd: '/ip/firewall/nat/print' },
    { title: 'IP Hotspot', cmd: '/ip/hotspot/print' },
    { title: 'IP Hotspot Profile', cmd: '/ip/hotspot/profile/print' },
    { title: 'IP Hotspot User', cmd: '/ip/hotspot/user/print' },
    { title: 'IP Hotspot IP-Binding', cmd: '/ip/hotspot/ip-binding/print' },
    { title: 'PPP Profiles', cmd: '/ppp/profile/print' },
    { title: 'PPP Secrets', cmd: '/ppp/secret/print' },
    { title: 'PPP Active', cmd: '/ppp/active/print' },
    { title: 'PPPoE Server', cmd: '/interface/pppoe-server/server/print' },
    { title: 'IP Routes', cmd: '/ip/route/print' },
    { title: 'System Clock', cmd: '/system/clock/print' },
    { title: 'Queue Simple', cmd: '/queue/simple/print' },
  ];

  let output = `# MikroTik Configuration Backup\n`;
  output += `# Date: ${new Date().toLocaleString('id-ID')}\n`;
  output += `# Host: ${HOST}\n\n`;

  for (const section of sections) {
    try {
      const data = await client.write(section.cmd);
      output += `## ${section.title}\n`;
      output += `## Command: ${section.cmd}\n`;
      output += JSON.stringify(data, null, 2) + '\n\n';
      console.log(`✅ ${section.title} (${data.length} items)`);
    } catch (err) {
      output += `## ${section.title}\n`;
      output += `## ERROR: ${err.message}\n\n`;
      console.log(`⚠️ ${section.title}: ${err.message}`);
    }
  }

  const filename = 'mikrotik-backup.json';
  fs.writeFileSync(filename, output);
  console.log(`\n✅ Backup saved to: ${filename}`);

  await client.close();
}

backupConfig().catch(err => {
  console.error('Failed:', err.message);
  process.exit(1);
});
