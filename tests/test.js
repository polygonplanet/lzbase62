'use strict';

var lzbase62 = require('../lzbase62');

var assert = require('assert');
var fs = require('fs');

describe('lzbase62', function() {

  var tests = {};

  before(function(done) {
    var i;

    tests.unicode = '';
    for (i = 0; i <= 0xffff; i++) {
      tests.unicode += String.fromCharCode(i);
    }

    tests.unicodeReverse = '';
    for (i = 0xffff; i >= 0; --i) {
      tests.unicodeReverse += String.fromCharCode(i);
    }

    tests.randoms = [];
    var s, code;
    for (var j = 0; j < 3; j++) {
      s = '';
      for (i = 0; i <= 0xffff; i++) {
        code = ~~(Math.random() * (0xffff + 1));
        s += String.fromCharCode(code);
      }
      tests.randoms.push(s);
    }

    tests.bits = [];
    var max = 60 * (60 + 1);
    var bits = [59, 60, 61, max - 1, max, max + 1];
    for (i = 0; i < bits.length; i++) {
      tests.bits.push(new Array(bits[i] + 1).join('a'));
    }

    tests.unicodeBits = [];
    for (i = 0; i < bits.length; i++) {
      tests.unicodeBits.push(new Array(bits[i] + 1).join('a\u3042'));
      tests.unicodeBits.push(new Array(bits[i] + 1).join('\u3042'));
      tests.unicodeBits.push(new Array(bits[i] + 1).join('\u3042a'));
    }

    tests.chars = [];
    for (i = 0; i <= 0xffff; i += 32) {
      tests.chars.push(new Array(100).join(String.fromCharCode(i)));
    }

    tests.hello = 'Hello World.';
    tests.code = fs.readFileSync(__filename);
    done();
  });

  describe('compress/decompress', function() {
    it('ascii string', function() {
      assert(tests.hello.length > 0);
      var compressed = lzbase62.compress(tests.hello);
      assert(compressed.length > 0);
      var decompressed = lzbase62.decompress(compressed);
      assert.equal(decompressed, tests.hello);
    });

    it('ascii string using onData events', function(done) {
      assert(tests.hello.length > 0);
      var compressed = [];
      lzbase62.compress(tests.hello, {
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
              assert.equal(result, tests.hello);
              done();
            }
          });
        }
      });
    });

    it('ascii string*5', function() {
      var s = new Array(6).join(tests.hello);
      assert(s.length > 0);
      var compressed = lzbase62.compress(s);
      assert(compressed.length > 0);
      assert(s.length > compressed.length);
      var decompressed = lzbase62.decompress(compressed);
      assert.equal(decompressed, s);
    });

    it('ascii string*5 using onData events', function(done) {
      var s = new Array(6).join(tests.hello);
      assert(s.length > 0);
      var compressed = [];
      lzbase62.compress(s, {
        onData: function(data) {
          compressed.push(data);
        },
        onEnd: function() {
          var result = compressed.join('');
          assert(result.length > 0);
          assert(s.length > result.length);

          var decompressed = [];
          lzbase62.decompress(result, {
            onData: function(data) {
              decompressed.push(data);
            },
            onEnd: function() {
              var result = decompressed.join('');
              assert(result.length > 0);
              assert.equal(result, s);
              done();
            }
          });
        }
      });
    });

    it('unicode [U+0000 - U+FFFF]', function() {
      assert(tests.unicode.length > 0);
      var compressed = lzbase62.compress(tests.unicode);
      assert(compressed.length > 0);
      var decompressed = lzbase62.decompress(compressed);
      assert.equal(decompressed, tests.unicode);
    });

    it('unicode [U+0000 - U+FFFF] using onData events', function(done) {
      assert(tests.unicode.length > 0);
      var compressed = [];
      lzbase62.compress(tests.unicode, {
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
              assert.equal(result, tests.unicode);
              done();
            }
          });
        }
      });
    });

    it('unicode [U+0000 - U+FFFF]*2', function() {
      var s = tests.unicode + tests.unicode;
      assert(s.length > 0);
      var compressed = lzbase62.compress(s);
      assert(compressed.length > 0);
      var decompressed = lzbase62.decompress(compressed);
      assert.equal(decompressed, s);
    });

    it('unicode [U+0000 - U+FFFF]*2 using onData events', function(done) {
      var s = tests.unicode + tests.unicode;
      assert(s.length > 0);
      var compressed = [];
      lzbase62.compress(s, {
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
              assert.equal(result, s);
              done();
            }
          });
        }
      });
    });

    it('unicode [U+0000 - U+FFFF] reverse', function() {
      assert(tests.unicodeReverse.length > 0);
      var compressed = lzbase62.compress(tests.unicodeReverse);
      assert(compressed.length > 0);
      var decompressed = lzbase62.decompress(compressed);
      assert.equal(decompressed, tests.unicodeReverse);
    });

    it('unicode [U+0000 - U+FFFF] reverse using onData events', function(done) {
      assert(tests.unicodeReverse.length > 0);
      var compressed = [];
      lzbase62.compress(tests.unicodeReverse, {
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
              assert.equal(result, tests.unicodeReverse);
              done();
            }
          });
        }
      });
    });

    it('unicode chars', function() {
      tests.chars.forEach(function(c) {
        assert(c.length > 0);
        var compressed = lzbase62.compress(c);
        assert(compressed.length > 0);
        assert(c.length > compressed.length);
        var decompressed = lzbase62.decompress(compressed);
        assert.equal(decompressed, c);
      });
    });

    it('unicode chars using onData events', function(done) {
      var length = tests.chars.length;
      var i = 0;

      tests.chars.forEach(function(c) {
        assert(c.length > 0);
        var compressed = [];
        lzbase62.compress(c, {
          onData: function(data) {
            compressed.push(data);
          },
          onEnd: function() {
            var result = compressed.join('');
            assert(result.length > 0);
            assert(c.length > result.length);

            var decompressed = [];
            lzbase62.decompress(result, {
              onData: function(data) {
                decompressed.push(data);
              },
              onEnd: function() {
                var result = decompressed.join('');
                assert(result.length > 0);
                assert.equal(result, c);
                if (++i === length) {
                  done();
                }
              }
            });
          }
        });
      });
    });

    it('random chars', function() {
      tests.randoms.forEach(function(c) {
        assert(c.length > 0);
        var compressed = lzbase62.compress(c);
        assert(compressed.length > 0);
        var decompressed = lzbase62.decompress(compressed);
        assert.equal(decompressed, c);
      });
    });

    it('random chars using onData events', function(done) {
      var length = tests.randoms.length;
      var i = 0;

      tests.randoms.forEach(function(c) {
        assert(c.length > 0);
        var compressed = [];
        lzbase62.compress(c, {
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
                assert.equal(result, c);
                if (++i === length) {
                  done();
                }
              }
            });
          }
        });
      });
    });

    it('bits', function() {
      tests.bits.forEach(function(c) {
        assert(c.length > 0);
        var compressed = lzbase62.compress(c);
        assert(compressed.length > 0);
        var decompressed = lzbase62.decompress(compressed);
        assert.equal(decompressed, c);
      });
    });

    it('bits using onData events', function(done) {
      var length = tests.bits.length;
      var i = 0;

      tests.bits.forEach(function(c) {
        assert(c.length > 0);
        var compressed = [];
        lzbase62.compress(c, {
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
                assert.equal(result, c);
                if (++i === length) {
                  done();
                }
              }
            });
          }
        });
      });
    });

    it('unicode bits', function() {
      tests.unicodeBits.forEach(function(c) {
        assert(c.length > 0);
        var compressed = lzbase62.compress(c);
        assert(compressed.length > 0);
        var decompressed = lzbase62.decompress(compressed);
        assert.equal(decompressed, c);
      });
    });

    it('unicode bits using onData events', function(done) {
      var length = tests.unicodeBits.length;
      var i = 0;

      tests.unicodeBits.forEach(function(c) {
        assert(c.length > 0);
        var compressed = [];
        lzbase62.compress(c, {
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
                assert.equal(result, c);
                if (++i === length) {
                  done();
                }
              }
            });
          }
        });
      });
    });

    it('this source code', function() {
      var s = new Array(5).join(tests.code.toString());
      assert(s.length > 0);
      var compressed = lzbase62.compress(s);
      assert(compressed.length > 0);
      var decompressed = lzbase62.decompress(compressed);
      assert.equal(decompressed, s);
    });

    it('this source code using onData events', function(done) {
      var s = new Array(5).join(tests.code.toString());
      assert(s.length > 0);
      var compressed = [];
      lzbase62.compress(s, {
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
              assert.equal(result, s);
              done();
            }
          });
        }
      });
    });

    it('this source code (Buffer)', function() {
      var buffer = tests.code;
      assert(buffer.length > 0);
      var compressed = lzbase62.compress(buffer);
      assert(compressed.length > 0);
      var decompressed = lzbase62.decompress(compressed);
      assert.equal(decompressed, buffer.toString());
    });

    it('this source code (Buffer) using onData events', function(done) {
      var buffer = tests.code;
      assert(buffer.length > 0);
      var compressed = [];
      lzbase62.compress(buffer, {
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
              assert.equal(result, buffer.toString());
              done();
            }
          });
        }
      });
    });
  });
});
