const nconf = require('../index');
nconf.setEncryptionKey("ECEA347837320EE03C67C4215F2D991F");

const stringVal = 'goodvalue';
const configFile = require('path').join(__dirname,'config.json');

module.exports = t => {
  t.test('use - config from file', async (t) => {
    nconf.use('testfile', { type: 'file', file: configFile });
    const val = nconf.get('configFileKeyA');
    t.same(val, stringVal);
  });
  t.test('use - config from JSON', async (t) => {
    nconf.use('jsonblob', { type: 'literal', store: { fromJSON: stringVal } });
    const val = nconf.get('fromJSON');
    t.same(val, stringVal);
  });
  t.test('env - can read an env', async (t) => {
    process.env.ENV_KEY = stringVal;
    nconf.env();
    const val = nconf.get('ENV_KEY');
    t.same(val, stringVal);
  });
  t.test('encryption - values are not stored in plaintext', async (t) => {
    nconf.use('plaintext', { type: 'literal', store: { plaintextkey: stringVal } });
    const key = nconf.get()['plaintextkey'];
    t.same(key, undefined);
  });
};

if (!module.parent) module.exports(require('tap'));
