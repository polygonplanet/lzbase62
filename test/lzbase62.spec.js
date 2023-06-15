const assert = require('assert');
const lzbase62 = require('../src/index');

describe('lzbase62', () => {
  it('should have valid main methods', () => {
    assert(typeof lzbase62.compress === 'function');
    assert(typeof lzbase62.decompress === 'function');
  });

  it('should have valid methods and properties', () => {
    assert(typeof lzbase62.version === 'string');
  });
});
