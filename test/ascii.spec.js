const assert = require('assert');
const lzbase62 = require('../src/index');

describe('ASCII', () => {
  let sampleAsciiString;

  before(() => {
    sampleAsciiString = ' !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~';
  });

  it('the sample values should have a valid length', () => {
    assert(sampleAsciiString.length === 95);
  });

  it('should compress simple ASCII string and decompress to original string', () => {
    const data = 'hello hello hello';
    assert(data.length === 17);

    const compressed = lzbase62.compress(data);
    assert(compressed === 'tYVccfxGM');
    assert(compressed.length === 9);

    const decompressed = lzbase62.decompress(compressed);
    assert(decompressed === 'hello hello hello');
    assert(decompressed === data);
  });

  it('should compress all ASCII strings and decompress to original string', () => {
    const compressed = lzbase62.compress(sampleAsciiString);
    assert(compressed.length > 0);

    const decompressed = lzbase62.decompress(compressed);
    assert.equal(decompressed, sampleAsciiString);
  });

  it('should compress all ASCII strings and decompress to original string using onData events', (done) => {
    const compressed = [];

    lzbase62.compress(sampleAsciiString, {
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
            assert.equal(result, sampleAsciiString);
            done();
          }
        });
      }
    });
  });

  it('should compress large ASCII string and decompress to original string', () => {
    const largeString = new Array(6).join(sampleAsciiString);
    assert(largeString.length > 0);

    const compressed = lzbase62.compress(largeString);
    assert(compressed.length > 0);
    assert(largeString.length > compressed.length);

    const decompressed = lzbase62.decompress(compressed);
    assert.equal(decompressed, largeString);
  });

  it('should compress large ASCII string and decompress to original string using onData events', (done) => {
    const largeString = new Array(6).join(sampleAsciiString);
    assert(largeString.length > 0);

    const compressed = [];

    lzbase62.compress(largeString, {
      onData: (data) => {
        compressed.push(data);
      },
      onEnd: () => {
        const result = compressed.join('');
        assert(result.length > 0);
        assert(largeString.length > result.length);

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
});
