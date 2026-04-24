const net = require('net');

const HOST = '192.168.1.11';
const PORT = 8728;
const USER = 'DIONIT';
const PASS = '123321';

function encodeWord(word) {
  const buf = Buffer.from(word, 'utf8');
  const len = buf.length;
  let lenBuf;
  if (len < 0x80) lenBuf = Buffer.from([len]);
  else if (len < 0x4000) lenBuf = Buffer.from([(len >> 8) | 0x80, len & 0xFF]);
  else lenBuf = Buffer.from([(len >> 16) | 0xC0, (len >> 8) & 0xFF, len & 0xFF]);
  return Buffer.concat([lenBuf, buf]);
}

function encodeSentence(words) {
  const parts = words.map(w => encodeWord(w));
  parts.push(Buffer.from([0x00]));
  return Buffer.concat(parts);
}

function decodeResponse(data) {
  const words = [];
  let offset = 0;
  while (offset < data.length) {
    let len, bytesRead;
    const b = data[offset];
    if (b === 0) { offset++; break; }
    if ((b & 0x80) === 0) { len = b; bytesRead = 1; }
    else if ((b & 0xC0) === 0x80) { len = ((b & 0x3F) << 8) | data[offset+1]; bytesRead = 2; }
    else { len = ((b & 0x1F) << 16) | (data[offset+1] << 8) | data[offset+2]; bytesRead = 3; }
    offset += bytesRead;
    words.push(data.slice(offset, offset + len).toString('utf8'));
    offset += len;
  }
  return words;
}

console.log('=== New-Style Login Test ===');
console.log(`User: ${USER} / Pass: ${PASS}\n`);

const s = new net.Socket();
let step = 0;

s.connect(PORT, HOST, () => {
  console.log('[1] TCP Connected');
  
  // NEW style: send /login with name and password directly
  const sentence = encodeSentence(['/login', `=name=${USER}`, `=password=${PASS}`]);
  console.log('[2] Sending new-style login');
  s.write(sentence);
});

let buffer = Buffer.alloc(0);

s.on('data', (data) => {
  buffer = Buffer.concat([buffer, data]);
  step++;
  
  if (step === 1) {
    const words = decodeResponse(buffer);
    console.log('[3] Login response:', words);
    buffer = Buffer.alloc(0);
    
    if (words[0] === '!done') {
      console.log('\n✅ LOGIN SUCCESS!\n');
      
      // Get identity
      s.write(encodeSentence(['/system/identity/print']));
    } else {
      console.log('\n❌ LOGIN FAILED');
      s.destroy();
    }
  } else if (step === 2) {
    const words = decodeResponse(buffer);
    console.log('[4] Router identity:', words);
    s.destroy();
  }
});

s.on('error', (e) => console.log('ERROR:', e.message));
s.on('close', () => { console.log('Done'); process.exit(0); });
s.setTimeout(10000, () => { console.log('TIMEOUT'); s.destroy(); });
