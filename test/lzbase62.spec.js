const assert = require('assert');
const lzbase62 = require('../src/index');

describe('lzbase62', () => {
  it('should have compress and decompress methods', () => {
    assert(typeof lzbase62.compress === 'function');
    assert(typeof lzbase62.decompress === 'function');
  });

  it('should have a string version property', () => {
    assert(typeof lzbase62.version === 'string');
  });
});
