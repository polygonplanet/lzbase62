const assert = require('assert');
const lzbase62 = require('../src/index');

describe('UNICODE', () => {
  let sampleCriticalValues, sampleCriticalNonAsciiValues;

  before(() => {
    let i;

    const max = 60 * (60 + 1);
    const bits = [59, 60, 61, max - 1, max, max + 1];

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

  it('the sample values should have a valid length', () => {
    assert(sampleCriticalValues.length === 6);
    assert(sampleCriticalNonAsciiValues.length === 18);
  });

  it('should compress the ASCII character array and decompress to original string', () => {
    sampleCriticalValues.forEach((continuousString) => {
      assert(continuousString.length > 0);

      const compressed = lzbase62.compress(continuousString);
      assert(compressed.length > 0);

      const decompressed = lzbase62.decompress(compressed);
      assert.equal(decompressed, continuousString);
    });
  });

  it('bits using onData events', (done) => {
    const length = sampleCriticalValues.length;
    let i = 0;

    sampleCriticalValues.forEach((continuousString) => {
      assert(continuousString.length > 0);
      const compressed = [];

      lzbase62.compress(continuousString, {
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

  it('should compress the Non-ASCII character array and decompress to original string', () => {
    sampleCriticalNonAsciiValues.forEach((continuousString) => {
      assert(continuousString.length > 0);

      const compressed = lzbase62.compress(continuousString);
      assert(compressed.length > 0);

      const decompressed = lzbase62.decompress(compressed);
      assert.equal(decompressed, continuousString);
    });
  });

  it('unicode bits using onData events', (done) => {
    const length = sampleCriticalNonAsciiValues.length;
    let i = 0;

    sampleCriticalNonAsciiValues.forEach((continuousString) => {
      assert(continuousString.length > 0);
      const compressed = [];

      lzbase62.compress(continuousString, {
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
