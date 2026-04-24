/**
 * MikroTik API Raw Client
 * Direct implementation of the MikroTik RouterOS API protocol using TCP sockets
 * Supports all RouterOS versions (6.x, 7.x)
 */

const net = require('net');
const crypto = require('crypto');

class MikrotikAPI {
  constructor(options) {
    this.host = options.host;
    this.port = options.port || 8728;
    this.user = options.user || 'admin';
    this.password = options.password || '';
    this.timeout = (options.timeout || 10) * 1000;
    this.socket = null;
    this.connected = false;
    this._buffer = Buffer.alloc(0);
  }

  /**
   * Encode word length according to MikroTik API protocol
   */
  _encodeLength(len) {
    if (len < 0x80) {
      return Buffer.from([len]);
    } else if (len < 0x4000) {
      return Buffer.from([
        (len >> 8) | 0x80,
        len & 0xFF
      ]);
    } else if (len < 0x200000) {
      return Buffer.from([
        (len >> 16) | 0xC0,
        (len >> 8) & 0xFF,
        len & 0xFF
      ]);
    } else if (len < 0x10000000) {
      return Buffer.from([
        (len >> 24) | 0xE0,
        (len >> 16) & 0xFF,
        (len >> 8) & 0xFF,
        len & 0xFF
      ]);
    } else {
      return Buffer.from([
        0xF0,
        (len >> 24) & 0xFF,
        (len >> 16) & 0xFF,
        (len >> 8) & 0xFF,
        len & 0xFF
      ]);
    }
  }

  /**
   * Decode word length from buffer, returns { length, bytesRead }
   */
  _decodeLength(buffer, offset = 0) {
    if (offset >= buffer.length) return null;
    
    const firstByte = buffer[offset];
    
    if ((firstByte & 0x80) === 0) {
      return { length: firstByte, bytesRead: 1 };
    } else if ((firstByte & 0xC0) === 0x80) {
      if (offset + 1 >= buffer.length) return null;
      return {
        length: ((firstByte & 0x3F) << 8) | buffer[offset + 1],
        bytesRead: 2
      };
    } else if ((firstByte & 0xE0) === 0xC0) {
      if (offset + 2 >= buffer.length) return null;
      return {
        length: ((firstByte & 0x1F) << 16) | (buffer[offset + 1] << 8) | buffer[offset + 2],
        bytesRead: 3
      };
    } else if ((firstByte & 0xF0) === 0xE0) {
      if (offset + 3 >= buffer.length) return null;
      return {
        length: ((firstByte & 0x0F) << 24) | (buffer[offset + 1] << 16) | (buffer[offset + 2] << 8) | buffer[offset + 3],
        bytesRead: 4
      };
    } else {
      if (offset + 4 >= buffer.length) return null;
      return {
        length: (buffer[offset + 1] << 24) | (buffer[offset + 2] << 16) | (buffer[offset + 3] << 8) | buffer[offset + 4],
        bytesRead: 5
      };
    }
  }

  /**
   * Encode a word (length-prefixed string)
   */
  _encodeWord(word) {
    const wordBuf = Buffer.from(word, 'utf8');
    return Buffer.concat([this._encodeLength(wordBuf.length), wordBuf]);
  }

  /**
   * Send a sentence (array of words + terminating empty word)
   */
  _sendSentence(words) {
    const parts = [];
    for (const word of words) {
      parts.push(this._encodeWord(word));
    }
    // Terminating zero-length word
    parts.push(Buffer.from([0x00]));
    
    const data = Buffer.concat(parts);
    this.socket.write(data);
  }

  /**
   * Read a complete sentence from the buffer
   * Returns array of words or null if incomplete
   */
  _readSentence() {
    const words = [];
    let offset = 0;

    while (offset < this._buffer.length) {
      const lenResult = this._decodeLength(this._buffer, offset);
      if (lenResult === null) return null; // Need more data

      offset += lenResult.bytesRead;

      if (lenResult.length === 0) {
        // End of sentence
        this._buffer = this._buffer.slice(offset);
        return words;
      }

      if (offset + lenResult.length > this._buffer.length) {
        return null; // Need more data
      }

      const word = this._buffer.slice(offset, offset + lenResult.length).toString('utf8');
      words.push(word);
      offset += lenResult.length;
    }

    return null; // Need more data
  }

  /**
   * Wait for a complete sentence response
   */
  _waitForSentence() {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        cleanup();
        reject(new Error('ETIMEDOUT: Response timeout'));
      }, this.timeout);

      const onData = (data) => {
        this._buffer = Buffer.concat([this._buffer, data]);
        const sentence = this._readSentence();
        if (sentence !== null) {
          cleanup();
          resolve(sentence);
        }
      };

      const onError = (err) => {
        cleanup();
        reject(err);
      };

      const onClose = () => {
        cleanup();
        reject(new Error('Connection closed'));
      };

      const cleanup = () => {
        clearTimeout(timer);
        this.socket.removeListener('data', onData);
        this.socket.removeListener('error', onError);
        this.socket.removeListener('close', onClose);
      };

      // Check if we already have a complete sentence in buffer
      const existing = this._readSentence();
      if (existing !== null) {
        clearTimeout(timer);
        resolve(existing);
        return;
      }

      this.socket.on('data', onData);
      this.socket.on('error', onError);
      this.socket.on('close', onClose);
    });
  }

  /**
   * MD5 challenge-response for old login method (pre-6.43)
   */
  _oldStyleLogin(challengeHex) {
    const challenge = Buffer.from(challengeHex, 'hex');
    const md5 = crypto.createHash('md5');
    md5.update(Buffer.from([0x00])); // null byte
    md5.update(Buffer.from(this.password, 'utf8'));
    md5.update(challenge);
    return '00' + md5.digest('hex');
  }

  /**
   * Connect and authenticate
   */
  async connect() {
    return new Promise((resolve, reject) => {
      this.socket = new net.Socket();
      this.socket.setTimeout(this.timeout);

      const onTimeout = () => {
        this.socket.destroy();
        reject(new Error('ETIMEDOUT: Connection timeout'));
      };

      const onError = (err) => {
        this.socket.destroy();
        reject(err);
      };

      this.socket.once('timeout', onTimeout);
      this.socket.once('error', onError);

      this.socket.connect(this.port, this.host, async () => {
        this.socket.removeListener('timeout', onTimeout);
        this.socket.removeListener('error', onError);
        this.socket.setTimeout(0); // Remove timeout after connect

        try {
          await this._login();
          this.connected = true;
          resolve();
        } catch (err) {
          this.socket.destroy();
          reject(err);
        }
      });
    });
  }

  /**
   * Login flow - tries new method first (RouterOS >= 6.43), falls back to old method
   * New method: /login with =name= and =password= directly
   * Old method: /login -> get challenge -> /login with MD5 response
   */
  async _login() {
    // Try new-style login first (RouterOS >= 6.43)
    console.log(`[MikroTik API] Trying new-style login for ${this.host}...`);
    this._sendSentence(['/login', `=name=${this.user}`, `=password=${this.password}`]);
    
    const response = await this._waitForSentence();
    
    if (response[0] === '!done') {
      // Check if router returned a challenge (means it wants old-style)
      const retWord = response.find(w => w.startsWith('=ret='));
      if (retWord) {
        // Router ignored new-style params and returned challenge — use old method
        const challenge = retWord.substring(5);
        const responseHash = this._oldStyleLogin(challenge);
        
        console.log(`[MikroTik API] Falling back to old-style login for ${this.host}`);
        this._sendSentence(['/login', `=name=${this.user}`, `=response=${responseHash}`]);
        
        const loginResponse = await this._waitForSentence();
        if (loginResponse[0] === '!done') {
          console.log(`[MikroTik API] Login successful to ${this.host} (old-style)`);
          return;
        }
        
        if (loginResponse[0] === '!trap') {
          const errMsg = loginResponse.find(w => w.startsWith('=message='));
          throw new Error(errMsg ? errMsg.substring(9) : 'Login failure');
        }
        
        throw new Error('Unexpected login response');
      }
      
      // New-style login successful
      console.log(`[MikroTik API] Login successful to ${this.host} (new-style)`);
      return;
    }
    
    if (response[0] === '!trap') {
      const errMsg = response.find(w => w.startsWith('=message='));
      const msg = errMsg ? errMsg.substring(9) : '';
      
      // If "missing parameter", router doesn't support new-style — try old method
      if (msg.includes('missing')) {
        console.log(`[MikroTik API] New-style not supported, trying old-style for ${this.host}`);
        this._sendSentence(['/login']);
        
        const oldResponse = await this._waitForSentence();
        if (oldResponse[0] === '!done') {
          const retWord = oldResponse.find(w => w.startsWith('=ret='));
          if (retWord) {
            const challenge = retWord.substring(5);
            const responseHash = this._oldStyleLogin(challenge);
            this._sendSentence(['/login', `=name=${this.user}`, `=response=${responseHash}`]);
            
            const loginResult = await this._waitForSentence();
            if (loginResult[0] === '!done') {
              console.log(`[MikroTik API] Login successful to ${this.host} (old-style)`);
              return;
            }
          }
        }
      }
      
      throw new Error(msg || 'Login failure');
    }
    
    throw new Error('Unexpected response: ' + response.join(', '));
  }

  /**
   * Send a command and read all response sentences until !done or !trap
   * @param {string} command - e.g., '/system/identity/print'
   * @param {Object} params - optional parameters as key-value
   * @returns {Array} - array of result objects
   */
  async write(command, params = {}) {
    if (!this.connected) throw new Error('Not connected');

    const words = [command];
    for (const [key, value] of Object.entries(params)) {
      words.push(`=${key}=${value}`);
    }
    this._sendSentence(words);

    const results = [];
    
    while (true) {
      const sentence = await this._waitForSentence();
      
      if (sentence[0] === '!done') {
        break;
      }
      
      if (sentence[0] === '!trap') {
        const errMsg = sentence.find(w => w.startsWith('=message='));
        throw new Error(errMsg ? errMsg.substring(9) : 'Command failed');
      }
      
      if (sentence[0] === '!re') {
        // Parse result attributes
        const obj = {};
        for (let i = 1; i < sentence.length; i++) {
          if (sentence[i].startsWith('=')) {
            const eqPos = sentence[i].indexOf('=', 1);
            if (eqPos !== -1) {
              const key = sentence[i].substring(1, eqPos);
              const value = sentence[i].substring(eqPos + 1);
              obj[key] = value;
            }
          }
        }
        results.push(obj);
      }
    }

    return results;
  }

  /**
   * Close the connection
   */
  async close() {
    this.connected = false;
    if (this.socket) {
      try {
        this._sendSentence(['/quit']);
        // Give it a moment to send
        await new Promise(r => setTimeout(r, 100));
      } catch {}
      this.socket.destroy();
      this.socket = null;
    }
  }
}

module.exports = MikrotikAPI;
