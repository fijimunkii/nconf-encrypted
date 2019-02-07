const nconf = require('../index');
const crypto = require('crypto');

const configFile = require('path').join(__dirname,'config.json');
const stringVal = 'goodvalue';
const stringKey = 'goodkey';

module.exports = t => {
  t.beforeEach(done => {
    nconf.reset();
    done();
  });
  t.test('use - config from file', async (t) => {
    nconf.use('testfile', { type: 'file', file: configFile });
    const val = nconf.get('configFileKeyA');
    t.same(val, stringVal);
  });
  t.test('use - config from JSON', async (t) => {
    nconf.use('jsonblob', { type: 'literal', store: { goodkey: stringVal } });
    const val = nconf.get(stringKey);
    t.same(val, stringVal);
  });
  t.test('add - config from file', async (t) => {
    nconf.add('testfile', { type: 'file', file: configFile });
    const val = nconf.get('configFileKeyA');
    t.same(val, stringVal);
  });
  t.test('env - can read an env', async (t) => {
    process.env[stringKey] = stringVal;
    nconf.env();
    const val = nconf.get(stringKey);
    t.same(val, stringVal);
  });
  t.test('encryption key - must be 256 bits (32 characters)', async (t) => {
    t.throws(() => nconf.setEncryptionKey('tooshort'));
    const validKey = crypto.randomBytes(16).toString('hex');
    t.doesNotThrow(() => nconf.setEncryptionKey(validKey));
  });
  t.test('encryption - keys are not stored in plaintext', async (t) => {
    nconf.use('encrypted', { type: 'literal', store: { goodkey: stringVal } });
    const store = nconf.get();
    const key = Object.keys(store)[0];
    const val = store[key];
    t.notEqual(val, stringKey);
  });
  t.test('encryption - values are not stored in plaintext', async (t) => {
    nconf.use('encrypted', { type: 'literal', store: { goodkey: stringVal } });
    const store = nconf.get();
    const key = Object.keys(store)[0];
    const val = store[key];
    t.notEqual(val, stringVal);
  });
  t.test('reset - clears all the stores', async (t) => {
    nconf.use('seeya', { type: 'literal', store: { goodkey: stringVal } });
    let store = nconf.get();
    t.equal(Object.keys(store).length, 1);
    nconf.reset();
    store = nconf.get();
    t.equal(store, undefined);
  });
  t.test('datatypes - string', async (t) => {
    nconf.use('string', { type: 'literal', store: { goodkey: stringVal } });
    const val = nconf.get(stringKey);
    t.equal(val, stringVal);
  });
  t.test('datatypes - array', async (t) => {
    nconf.use('string', { type: 'literal', store: { goodkey: [stringVal,stringVal] } });
    const val = nconf.get(stringKey);
    t.strictSame(val, [stringVal,stringVal]);
  });
  t.test('datatypes - nested object', async (t) => {
    const nestedObject = {
      goodkey: { goodkey: { goodkey: { goodkey: [stringVal,stringVal] } } }
    };
    nconf.use('string', { type: 'literal', store: nestedObject });
    const val = nconf.get(stringKey);
    t.strictSame(val, nestedObject[stringKey]);
  });
  t.test('datatypes - number', async (t) => {
    nconf.use('number', { type: 'literal', store: { goodkey: [1,2] } });
    const val = nconf.get(stringKey);
    t.strictSame(val, [1,2]);
  });
};

if (!module.parent) module.exports(require('tap'));
