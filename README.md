# nconf-encrypted
Keep your secrets safe!

[![License: ISC](https://img.shields.io/npm/l/real-user-agent.svg)](https://opensource.org/licenses/ISC)

Encrypted wrapper around nconf.

```js
const nconf = require('nconf-encrypted');

nconf
  .setEncryptionKey(`32CharacterString`)
  .argv()
  .env()
  .use('someConfigFile', { type: 'file', file: '/path/to/config.json' })
  .use('moreConfig', { type: 'literal', store: { a: 'OK', b: true } });

// retrieve value
nconf.get('a'); // 'OK'

// view all stores (note all keys and values are now encrypted)
nconf.get();

// Extra trick to prevent rogue modules from leaking / dumping environment variables
process.argv = [];
process.env = {};
```

## Authors

fijimunkii

## License

This project is licensed under the ISC License - see the [LICENSE](LICENSE.txt) file for details.
