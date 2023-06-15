const assert = require('assert');
const lzbase62 = require('../src/index');

describe('UNICODE', () => {
  let sampleUnicode, sampleReversedUnicode, sampleContinuousCharsArray;

  before(() => {
    let i;

    sampleUnicode = '';
    for (i = 0; i <= 0xffff; i++) {
      sampleUnicode += String.fromCharCode(i);
    }

    sampleReversedUnicode = '';
    for (i = 0xffff; i >= 0; --i) {
      sampleReversedUnicode += String.fromCharCode(i);
    }

    sampleContinuousCharsArray = [];
    for (i = 0; i <= 0xffff; i += 32) {
      sampleContinuousCharsArray.push(new Array(100).join(String.fromCharCode(i)));
    }
  });

  it('the sample values should have a valid length', () => {
    assert(sampleUnicode.length === 65536);
    assert(sampleReversedUnicode.length === 65536);
    assert(sampleContinuousCharsArray.length === 2048);
  });

  it('should compress UNICODE [U+0000 - U+FFFF] string and decompress to original string', () => {
    const compressed = lzbase62.compress(sampleUnicode);
    assert(compressed.length > 0);

    const decompressed = lzbase62.decompress(compressed);
    assert.equal(decompressed, sampleUnicode);
  });

  it('should compress UNICODE [U+0000 - U+FFFF] string and decompress to original string using onData events', (done) => {
    const compressed = [];

    lzbase62.compress(sampleUnicode, {
      onData: (data) => {
        compressed.push(data);
      },
      onEnd: () => {
        const result = compressed.join('');
        assert(result.length > 0);

        const decompressed = [];
        lzbase62.decompress(result, {
          onData: (data) => {
            decompressed.push(data);
          },
          onEnd: () => {
            const result = decompressed.join('');
            assert(result.length > 0);
            assert.equal(result, sampleUnicode);
            done();
          }
        });
      }
    });
  });

  it('should compress large UNICODE string and decompress to original string', () => {
    const largeString = sampleUnicode + sampleUnicode;
    assert(largeString.length > 0);

    const compressed = lzbase62.compress(largeString);
    assert(compressed.length > 0);

    const decompressed = lzbase62.decompress(compressed);
    assert.equal(decompressed, largeString);
  });

  it('should compress large UNICODE string and decompress to original string using onData events', (done) => {
    const largeString = sampleUnicode + sampleUnicode;
    assert(largeString.length > 0);

    const compressed = [];

    lzbase62.compress(largeString, {
      onData: (data) => {
        compressed.push(data);
      },
      onEnd: () => {
        const result = compressed.join('');
        assert(result.length > 0);

        const decompressed = [];
        lzbase62.decompress(result, {
          onData: (data) => {
            decompressed.push(data);
          },
          onEnd: () => {
            const result = decompressed.join('');
            assert(result.length > 0);
            assert.equal(result, largeString);
            done();
          }
        });
      }
    });
  });

  it('should compress reversed UNICODE string and decompress to original string', () => {
    const compressed = lzbase62.compress(sampleReversedUnicode);
    assert(compressed.length > 0);

    const decompressed = lzbase62.decompress(compressed);
    assert.equal(decompressed, sampleReversedUnicode);
  });

  it('should compress reversed UNICODE string and decompress to original string using onData events', (done) => {
    const compressed = [];

    lzbase62.compress(sampleReversedUnicode, {
      onData: (data) => {
        compressed.push(data);
      },
      onEnd: () => {
        const result = compressed.join('');
        assert(result.length > 0);

        const decompressed = [];
        lzbase62.decompress(result, {
          onData: (data) => {
            decompressed.push(data);
          },
          onEnd: () => {
            const result = decompressed.join('');
            assert(result.length > 0);
            assert.equal(result, sampleReversedUnicode);
            done();
          }
        });
      }
    });
  });

  it('should compress the continuous character array and decompress to the original array', () => {
    sampleContinuousCharsArray.forEach((continuousString) => {
      assert(continuousString.length > 0);

      const compressed = lzbase62.compress(continuousString);
      assert(compressed.length > 0);
      assert(continuousString.length > compressed.length);

      const decompressed = lzbase62.decompress(compressed);
      assert.equal(decompressed, continuousString);
    });
  });

  it('should compress the continuous character array and decompress to the original array using onData events', (done) => {
    const length = sampleContinuousCharsArray.length;
    let i = 0;

    sampleContinuousCharsArray.forEach((continuousString) => {
      assert(continuousString.length > 0);
      const compressed = [];

      lzbase62.compress(continuousString, {
        onData: (data) => {
          compressed.push(data);
        },
        onEnd: () => {
          const result = compressed.join('');
          assert(result.length > 0);
          assert(continuousString.length > result.length);

          const decompressed = [];
          lzbase62.decompress(result, {
            onData: (data) => {
              decompressed.push(data);
            },
            onEnd: () => {
              const result = decompressed.join('');
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
