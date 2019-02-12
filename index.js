const fs = require('fs');
const nconf = require('nconf');
const crypto = require('crypto');
const IV_LENGTH = 16; // For AES, this is always 16
const KEY_IV = crypto.randomBytes(IV_LENGTH); // Key lookup requires static iv
let ENCRYPTION_KEY = crypto.randomBytes(IV_LENGTH).toString('hex'); // Must be 256 bits (32 characters)

module.exports = {
  setEncryptionKey: d => {
    validateEncryptionKey(d);
    ENCRYPTION_KEY = d;
    return module.exports;
  },
  get: key => key ? get(key) : nconf.get(),
  env: options => {
    nconf.env(Object.assign({ transform }, options));
    return module.exports;
  },
  argv: options => {
    nconf.argv(Object.assign({ transform }, options));
    return module.exports;
  },
  use: (name, options) => {
    let store;
    if (options.type === 'literal') {
      store = options.store;
    } else if (options.type === 'file') {
      store = JSON.parse(fs.readFileSync(options.file)); 
    }
    nconf.use(encrypt(name), { type: 'literal', store: encrypt(store) });
    return module.exports;
  },
  add: (name, options) => module.exports.use(name, options),
  file: (name, file) => {
    if (name && !file) {
      file = name;
    }
    return module.exports.use(name, { type: 'file', file });
  },
  defaults: d => {
    nconf.defaults(encrypt(d));
    return module.exports;
  },
  overrides: d => {
    nconf.overrides(encrypt(d));
    return module.exports;
  },
  any: function() {
    let args = Array.from(arguments);
    if (Array.isArray(args[0])) {
      args = args[0]; 
    }
    return nconf.any(args.map(d => encrypt(d)));
  },
  remove: d => {
    nconf.remove(encrypt(d));
    return module.exports;
  },
  required: d => {
    nconf.required(encrypt(d));
    return module.exports;
  },
  reset: () => {
    Object.keys(nconf.stores).forEach(store => { delete nconf.stores[store]; });
    return module.exports;
  },
  clear: key => {
    nconf.clear(key);
    return module.exports;
  },
//  save
//  load
//  set: (key, value) => nconf.set(encrypt(key, true), encrypt(value)),
};

function transform(data) {
  return {
    key: encrypt(data.key, true),
    value: encrypt(data.value)
  };
}

function get(key) {
  const isObject = String(key).includes(':');
  if (!isObject) {
    return decrypt(nconf.get(encrypt(key, true)));
  } else {
    return String(key).split(':').reduce((o,keySegment) => {
      return o ? o[keySegment] : decrypt(nconf.get(encrypt(keySegment, true)));
    }, null);
  }
}

function encrypt(d, isKey) {
  validateEncryptionKey();
  if (typeof d === 'undefined') {
    return;
  } else if (Array.isArray(d)) {
    return d.map(encrypt);
  } else if (typeof d === 'object') {
    return Object.keys(d).reduce((o,dd) => (o[encrypt(dd,true)]=encrypt(d[dd])) && o, {});
  } else {
    const data = String(d);
    const iv = isKey ? KEY_IV : crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', new Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(data);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + '|' + encrypted.toString('hex');
  }
}
function decrypt(d) {
  validateEncryptionKey();
  if (typeof d === 'undefined') {
    return;
  } else if (Array.isArray(d)) {
    return d.map(decrypt);
  } else if (typeof d === 'object') {
    return Object.keys(d).reduce((o,dd) => (o[decrypt(dd)]=decrypt(d[dd])) && o, {});
  } else {
    const textParts = d.split('|');
    const iv = new Buffer.from(textParts.shift(), 'hex');
    const encryptedText = new Buffer.from(textParts.join('|'), 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', new Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  }
}
function validateEncryptionKey(d) {
  const key = d || ENCRYPTION_KEY;
  if (typeof key === 'undefined') {
    throw new Error('Encryption Key must be set - nconf.setEncryptionKey()');
  } else if (key.length !== 32) {
    throw new Error('Encryption Key must be 256 bits (32 characters)');
  }
}
