var assert = require('assert');
var lzbase62 = require('../src/index');

describe('ASCII', function() {
  var sampleAsciiString;

  before(function() {
    sampleAsciiString = ' !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~';
  });

  it('the sample values should have a valid length', function() {
    assert(sampleAsciiString.length === 95);
  });

  it('should compress simple ASCII string and decompress to original string', function() {
    var data = 'hello hello hello';
    assert(data.length === 17);

    var compressed = lzbase62.compress(data);
    assert(compressed === 'tYVccfxGM');
    assert(compressed.length === 9);

    var decompressed = lzbase62.decompress(compressed);
    assert(decompressed === 'hello hello hello');
    assert(decompressed === data);
  });

  it('should compress all ASCII strings and decompress to original string', function() {
    var compressed = lzbase62.compress(sampleAsciiString);
    assert(compressed.length > 0);

    var decompressed = lzbase62.decompress(compressed);
    assert.equal(decompressed, sampleAsciiString);
  });

  it('should compress all ASCII strings and decompress to original string using onData events', function(done) {
    var compressed = [];

    lzbase62.compress(sampleAsciiString, {
      onData: function(data) {
        compressed.push(data);
      },
      onEnd: function() {
        var result = compressed.join('');
        assert(result.length > 0);

        var decompressed = [];
        lzbase62.decompress(result, {
          onData: function(data) {
            decompressed.push(data);
          },
          onEnd: function() {
            var result = decompressed.join('');
            assert(result.length > 0);
            assert.equal(result, sampleAsciiString);
            done();
          }
        });
      }
    });
  });

  it('should compress large ASCII string and decompress to original string', function() {
    var largeString = new Array(6).join(sampleAsciiString);
    assert(largeString.length > 0);

    var compressed = lzbase62.compress(largeString);
    assert(compressed.length > 0);
    assert(largeString.length > compressed.length);

    var decompressed = lzbase62.decompress(compressed);
    assert.equal(decompressed, largeString);
  });

  it('should compress large ASCII string and decompress to original string using onData events', function(done) {
    var largeString = new Array(6).join(sampleAsciiString);
    assert(largeString.length > 0);

    var compressed = [];

    lzbase62.compress(largeString, {
      onData: function(data) {
        compressed.push(data);
      },
      onEnd: function() {
        var result = compressed.join('');
        assert(result.length > 0);
        assert(largeString.length > result.length);

        var decompressed = [];
        lzbase62.decompress(result, {
          onData: function(data) {
            decompressed.push(data);
          },
          onEnd: function() {
            var result = decompressed.join('');
            assert(result.length > 0);
            assert.equal(result, largeString);
            done();
          }
        });
      }
    });
  });
});
