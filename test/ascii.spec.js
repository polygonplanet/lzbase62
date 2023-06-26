const assert = require('assert');
const lzbase62 = require('../src/index');

describe('ASCII string', () => {
  let sampleAsciiString;

  beforeEach(() => {
    sampleAsciiString = ' !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~';
  });

  afterEach(() => {
    sampleAsciiString = null;
  });

  it('should have 95 characters, which is the number of printable ASCII characters', () => {
    assert(sampleAsciiString.length === 95);
  });

  it('should correctly compress and decompress repeated ASCII string', () => {
    const data = 'hello hello hello';
    assert(data.length === 17);

    const compressed = lzbase62.compress(data);
    assert(compressed === 'tYVccfxGM');
    assert(compressed.length === 9);

    const decompressed = lzbase62.decompress(compressed);
    assert(decompressed === data);
  });

  it('should correctly compress and decompress printable ASCII characters', () => {
    const compressed = lzbase62.compress(sampleAsciiString);
    assert(compressed.length > 0);

    const decompressed = lzbase62.decompress(compressed);
    assert.equal(decompressed, sampleAsciiString);
  });

  it('should correctly compress and decompress ASCII string with onData and onEnd callbacks', (done) => {
    const compressedChunks = [];

    lzbase62.compress(sampleAsciiString, {
      onData: (chunk) => {
        compressedChunks.push(chunk);
      },
      onEnd: () => {
        assert(compressedChunks.length > 0);

        const compressedStr = compressedChunks.join('');
        const decompressedChunks = [];

        lzbase62.decompress(compressedStr, {
          onData: (chunk) => {
            decompressedChunks.push(chunk);
          },
          onEnd: () => {
            assert(decompressedChunks.length > 0);

            const decompressedStr = decompressedChunks.join('');
            assert.equal(decompressedStr, sampleAsciiString);
            done();
          }
        });
      }
    });
  });

  describe('Large ASCII string', () => {
    let largeString;

    beforeEach(() => {
      largeString = new Array(6).join(sampleAsciiString);
    });

    afterEach(() => {
      largeString = null;
    });

    it('should correctly compress and decompress large ASCII string', () => {
      const compressed = lzbase62.compress(largeString);
      assert(largeString.length > compressed.length);

      const decompressed = lzbase62.decompress(compressed);
      assert.equal(decompressed, largeString);
    });

    it('should correctly compress and decompress large ASCII string with onData and onEnd callbacks', (done) => {
      const compressedChunks = [];

      lzbase62.compress(largeString, {
        onData: (chunk) => {
          compressedChunks.push(chunk);
        },
        onEnd: () => {
          assert(compressedChunks.length > 0);

          const compressedStr = compressedChunks.join('');
          const decompressedChunks = [];

          lzbase62.decompress(compressedStr, {
            onData: (chunk) => {
              decompressedChunks.push(chunk);
            },
            onEnd: () => {
              assert(decompressedChunks.length > 0);

              const decompressedStr = decompressedChunks.join('');
              assert.equal(decompressedStr, largeString);
              done();
            }
          });
        }
      });
    });
  });
});
