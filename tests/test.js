'use strict';

var lzbase62 = require('../lzbase62');

var assert = require('assert');
var fs = require('fs');

describe('lzbase62', function() {

  var testString = {};

  before(function(done) {
    var i;
    testString.unicode = '';
    for (i = 0; i <= 0xffff; i++) {
      testString.unicode += String.fromCharCode(i);
    }

    testString.chars = [];
    for (i = 0; i <= 0xffff; i += 32) {
      testString.chars.push(new Array(100).join(String.fromCharCode(i)));
    }

    testString.hello = 'Hello World.';
    testString.code = fs.readFileSync(__filename);
    done();
  });

  describe('compress/decompress', function() {
    it('ascii string', function() {
      assert(testString.hello.length > 0);
      var compressed = lzbase62.compress(testString.hello);
      assert(compressed.length > 0);
      var decompressed = lzbase62.decompress(compressed);
      assert.equal(decompressed, testString.hello);
    });

    it('ascii string*5', function() {
      var s = new Array(6).join(testString.hello);
      assert(s.length > 0);
      var compressed = lzbase62.compress(s);
      assert(compressed.length > 0);
      assert(s.length > compressed.length);
      var decompressed = lzbase62.decompress(compressed);
      assert.equal(decompressed, s);
    });

    it('unicode [U+0000 - U+FFFF]', function() {
      assert(testString.unicode.length > 0);
      var compressed = lzbase62.compress(testString.unicode);
      assert(compressed.length > 0);
      var decompressed = lzbase62.decompress(compressed);
      assert.equal(decompressed, testString.unicode);
    });

    it('unicode [U+0000 - U+FFFF]*2', function() {
      var s = testString.unicode + testString.unicode;
      assert(s.length > 0);
      var compressed = lzbase62.compress(s);
      assert(compressed.length > 0);
      var decompressed = lzbase62.decompress(compressed);
      assert.equal(decompressed, s);
    });

    it('unicode chars', function() {
      testString.chars.forEach(function(c) {
        assert(c.length > 0);
        var compressed = lzbase62.compress(c);
        assert(compressed.length > 0);
        assert(c.length > compressed.length);
        var decompressed = lzbase62.decompress(compressed);
        assert.equal(decompressed, c);
      });
    });

    it('this source code', function() {
      var s = new Array(5).join(testString.code.toString());
      assert(s.length > 0);
      var compressed = lzbase62.compress(s);
      assert(compressed.length > 0);
      var decompressed = lzbase62.decompress(compressed);
      assert.equal(decompressed, s);
    });

    it('this source code (Buffer)', function() {
      var buffer = testString.code;
      assert(buffer.length > 0);
      var compressed = lzbase62.compress(buffer);
      assert(compressed.length > 0);
      var decompressed = lzbase62.decompress(compressed);
      assert.equal(decompressed, buffer.toString());
    });
  });
});
