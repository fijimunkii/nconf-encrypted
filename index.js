let ENCRYPTION_KEY; // Must be 256 bits (32 characters)
const IV_LENGTH = 16; // For AES, this is always 16
const crypto = require('crypto');
const nconf = require('nconf');
const fs = require('fs');

module.exports = {
  setEncryptionKey: d => {
    if (!d || d.length !== 32) {
      throw new Error('Encryption Key must be 256 bits (32 characters)');
    }
    ENCRYPTION_KEY = d;
    return module.exports;
  },
  get: d => decrypt(nconf.get(d)),
  set: d => nconf.set(encrypt(d)),
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
  add: module.exports.use,
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
    let args = ...arguments;
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
//  save
//  load
};

function transform(data) {
  return {
    key: encrypt(data.key),
    value: encrypt(data.value)
  };
}

function encrypt(d) {
  if (typeof d === 'undefined') {
    return;
  } else if (Array.isArray(d)) {
    return d.map(encrypt);
  } else if (typeof d === 'object') {
    return Object.keys(d).reduce((o,dd) => (o[dd]=encrypt(d[dd])) && o, {});
  } else {
    let iv = crypto.randomBytes(IV_LENGTH);
    let cipher = crypto.createCipheriv('aes-256-cbc', new Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(d);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  }
}
function decrypt(d) {
  if (typeof d === 'undefined') {
    return;
  } else if (Array.isArray(d)) {
    return d.map(decrypt);
  } else if (typeof d === 'object') {
    return Object.keys(d).reduce((o,dd) => (o[dd]=decrypt(d[dd])) && o, {});
  } else {
    let textParts = d.split(':');
    let iv = new Buffer.from(textParts.shift(), 'hex');
    let encryptedText = new Buffer.from(textParts.join(':'), 'hex');
    let decipher = crypto.createDecipheriv('aes-256-cbc', new Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  }
}
