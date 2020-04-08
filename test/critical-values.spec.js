var assert = require('assert');
var lzbase62 = require('../src/index');

describe('UNICODE', function() {
  var sampleCriticalValues, sampleCriticalNonAsciiValues;

  before(function() {
    var i;

    var max = 60 * (60 + 1);
    var bits = [59, 60, 61, max - 1, max, max + 1];

    sampleCriticalValues = [];
    for (i = 0; i < bits.length; i++) {
      sampleCriticalValues.push(new Array(bits[i] + 1).join('a'));
    }

    sampleCriticalNonAsciiValues = [];
    for (i = 0; i < bits.length; i++) {
      sampleCriticalNonAsciiValues.push(new Array(bits[i] + 1).join('a\u3042'));
      sampleCriticalNonAsciiValues.push(new Array(bits[i] + 1).join('\u3042'));
      sampleCriticalNonAsciiValues.push(new Array(bits[i] + 1).join('\u3042a'));
    }
  });

  it('the sample values should have a valid length', function() {
    assert(sampleCriticalValues.length === 6);
    assert(sampleCriticalNonAsciiValues.length === 18);
  });

  it('should compress the ASCII character array and decompress to original string', function() {
    sampleCriticalValues.forEach(function(continuousString) {
      assert(continuousString.length > 0);

      var compressed = lzbase62.compress(continuousString);
      assert(compressed.length > 0);

      var decompressed = lzbase62.decompress(compressed);
      assert.equal(decompressed, continuousString);
    });
  });

  it('bits using onData events', function(done) {
    var length = sampleCriticalValues.length;
    var i = 0;

    sampleCriticalValues.forEach(function(continuousString) {
      assert(continuousString.length > 0);
      var compressed = [];

      lzbase62.compress(continuousString, {
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
              assert.equal(result, continuousString);
              if (++i === length) {
                done();
              }
            }
          });
        }
      });
    });
  });

  it('should compress the Non-ASCII character array and decompress to original string', function() {
    sampleCriticalNonAsciiValues.forEach(function(continuousString) {
      assert(continuousString.length > 0);

      var compressed = lzbase62.compress(continuousString);
      assert(compressed.length > 0);

      var decompressed = lzbase62.decompress(compressed);
      assert.equal(decompressed, continuousString);
    });
  });

  it('unicode bits using onData events', function(done) {
    var length = sampleCriticalNonAsciiValues.length;
    var i = 0;

    sampleCriticalNonAsciiValues.forEach(function(continuousString) {
      assert(continuousString.length > 0);
      var compressed = [];

      lzbase62.compress(continuousString, {
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
              assert.equal(result, continuousString);
              if (++i === length) {
                done();
              }
            }
          });
        }
      });
    });
  });
});
