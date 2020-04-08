var assert = require('assert');
var lzbase62 = require('../src/index');

describe('lzbase62', function() {
  var sampleUnicode, sampleUnicodeReverse, sampleBits, sampleUnicodeBits, sampleChars, sampleHello;

  before(function() {
    var i;
    sampleUnicode= '';
    for (i = 0; i <= 0xffff; i++) {
      sampleUnicode += String.fromCharCode(i);
    }

    sampleUnicodeReverse = '';
    for (i = 0xffff; i >= 0; --i) {
      sampleUnicodeReverse += String.fromCharCode(i);
    }

    sampleBits = [];
    var max = 60 * (60 + 1);
    var bits = [59, 60, 61, max - 1, max, max + 1];
    for (i = 0; i < bits.length; i++) {
      sampleBits.push(new Array(bits[i] + 1).join('a'));
    }

    sampleUnicodeBits = [];
    for (i = 0; i < bits.length; i++) {
      sampleUnicodeBits.push(new Array(bits[i] + 1).join('a\u3042'));
      sampleUnicodeBits.push(new Array(bits[i] + 1).join('\u3042'));
      sampleUnicodeBits.push(new Array(bits[i] + 1).join('\u3042a'));
    }

    sampleChars = [];
    for (i = 0; i <= 0xffff; i += 32) {
      sampleChars.push(new Array(100).join(String.fromCharCode(i)));
    }

    sampleHello = 'Hello World.';
  });

  describe('compress/decompress', function() {
    it('compress and decompress sample string', function() {
      var data = 'hello hello hello';
      assert(data.length === 17);

      var compressed = lzbase62.compress(data);
      assert(compressed === 'tYVccfxGM');
      assert(compressed.length === 9);

      var decompressed = lzbase62.decompress(compressed);
      assert(decompressed === 'hello hello hello');
      assert(decompressed === data);
    });

    it('ascii string', function() {
      assert(sampleHello.length > 0);
      var compressed = lzbase62.compress(sampleHello);
      assert(compressed.length > 0);
      var decompressed = lzbase62.decompress(compressed);
      assert.equal(decompressed, sampleHello);
    });

    it('ascii string*5', function() {
      var s = new Array(6).join(sampleHello);
      assert(s.length > 0);
      var compressed = lzbase62.compress(s);
      assert(compressed.length > 0);
      assert(s.length > compressed.length);
      var decompressed = lzbase62.decompress(compressed);
      assert.equal(decompressed, s);
    });

    it('unicode [U+0000 - U+FFFF]', function() {
      assert(sampleUnicode.length > 0);
      var compressed = lzbase62.compress(sampleUnicode);
      assert(compressed.length > 0);
      var decompressed = lzbase62.decompress(compressed);
      assert.equal(decompressed, sampleUnicode);
    });

    it('unicode [U+0000 - U+FFFF]*2', function() {
      var s = sampleUnicode + sampleUnicode;
      assert(s.length > 0);
      var compressed = lzbase62.compress(s);
      assert(compressed.length > 0);
      var decompressed = lzbase62.decompress(compressed);
      assert.equal(decompressed, s);
    });

    it('unicode [U+0000 - U+FFFF] reverse', function() {
      assert(sampleUnicodeReverse.length > 0);
      var compressed = lzbase62.compress(sampleUnicodeReverse);
      assert(compressed.length > 0);
      var decompressed = lzbase62.decompress(compressed);
      assert.equal(decompressed, sampleUnicodeReverse);
    });

    it('unicode chars', function() {
      sampleChars.forEach(function(c) {
        assert(c.length > 0);
        var compressed = lzbase62.compress(c);
        assert(compressed.length > 0);
        assert(c.length > compressed.length);
        var decompressed = lzbase62.decompress(compressed);
        assert.equal(decompressed, c);
      });
    });

    it('bits', function() {
      sampleBits.forEach(function(c) {
        assert(c.length > 0);
        var compressed = lzbase62.compress(c);
        assert(compressed.length > 0);
        var decompressed = lzbase62.decompress(compressed);
        assert.equal(decompressed, c);
      });
    });

    it('unicode bits', function() {
      sampleUnicodeBits.forEach(function(c) {
        assert(c.length > 0);
        var compressed = lzbase62.compress(c);
        assert(compressed.length > 0);
        var decompressed = lzbase62.decompress(compressed);
        assert.equal(decompressed, c);
      });
    });
  });
});
