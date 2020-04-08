var assert = require('assert');
var lzbase62 = require('../src/index');

describe('lzbase62', function() {
  it('should have valid main methods', function() {
    assert(typeof lzbase62.compress === 'function');
    assert(typeof lzbase62.decompress === 'function');
  });

  it('should have valid methods and properties', function() {
    assert(typeof lzbase62.version === 'string');
  });
});
