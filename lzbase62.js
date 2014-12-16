/**
 * lzbase62
 *
 * @description  LZ77(LZSS) based compression algorithm in base62 for JavaScript.
 * @fileOverview Data compression library
 * @version      1.4.2
 * @date         2014-12-16
 * @link         https://github.com/polygonplanet/lzbase62
 * @copyright    Copyright (c) 2014 polygon planet <polygon.planet.aqua@gmail.com>
 * @license      Licensed under the MIT license.
 */

(function(name, context, factory) {

  // Supports UMD. AMD, CommonJS/Node.js and browser context
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      module.exports = factory();
    } else {
      exports[name] = factory();
    }
  } else if (typeof define === 'function' && define.amd) {
    define(factory);
  } else {
    context[name] = factory();
  }

}('lzbase62', this, function() {
  'use strict';

  var fromCharCode = String.fromCharCode;

  var HAS_TYPED = typeof Uint8Array !== 'undefined' &&
                  typeof Uint16Array !== 'undefined';

  // Test for String.fromCharCode.apply.
  var CAN_CHARCODE_APPLY = false;
  var CAN_CHARCODE_APPLY_TYPED = false;

  try {
    if (fromCharCode.apply(null, [0x61]) === 'a') {
      CAN_CHARCODE_APPLY = true;
    }
  } catch (e) {}

  if (HAS_TYPED) {
    try {
      if (fromCharCode.apply(null, new Uint8Array([0x61])) === 'a') {
        CAN_CHARCODE_APPLY_TYPED = true;
      }
    } catch (e) {}
  }

  var BASE62TABLE =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  // Buffers
  var TABLE_LENGTH = BASE62TABLE.length;
  var TABLE_DIFF = Math.max(TABLE_LENGTH, 62) - Math.min(TABLE_LENGTH, 62);
  var BUFFER_MAX = TABLE_LENGTH - 1;
  var TABLE_BUFFER_MAX = BUFFER_MAX * (BUFFER_MAX + 1);

  // Sliding Window
  var WINDOW_MAX = 1024;
  var WINDOW_BUFFER_MAX = 304; // maximum 304

  // fn.apply stack max range
  var APPLY_BUFFER_SIZE = 65533;

  // Chunk buffer length
  var COMPRESS_CHUNK_SIZE = APPLY_BUFFER_SIZE;
  var COMPRESS_CHUNK_MAX = COMPRESS_CHUNK_SIZE - TABLE_LENGTH;
  var DECOMPRESS_CHUNK_SIZE = APPLY_BUFFER_SIZE;
  var DECOMPRESS_CHUNK_MAX = DECOMPRESS_CHUNK_SIZE + WINDOW_MAX * 2;

  // Unicode table : U+0000 - U+0084
  var LATIN_CHAR_MAX = 11;
  var LATIN_BUFFER_MAX = LATIN_CHAR_MAX * (LATIN_CHAR_MAX + 1);

  // Unicode table : U+0000 - U+FFFF
  var UNICODE_CHAR_MAX = 40;
  var UNICODE_BUFFER_MAX = UNICODE_CHAR_MAX * (UNICODE_CHAR_MAX + 1);

  // Index positions
  var LATIN_INDEX = TABLE_LENGTH + 1;
  var LATIN_INDEX_START = TABLE_DIFF + 20;
  var UNICODE_INDEX = TABLE_LENGTH + 5;

  // Decode/Start positions
  var DECODE_MAX = TABLE_LENGTH - TABLE_DIFF - 19;
  var LATIN_DECODE_MAX = UNICODE_CHAR_MAX + 7;
  var CHAR_START = LATIN_DECODE_MAX + 1;
  var COMPRESS_START = CHAR_START + 1;
  var COMPRESS_FIXED_START = COMPRESS_START + 5;
  var COMPRESS_INDEX = COMPRESS_FIXED_START + 5; // 59

  // Currently, 60 and 61 of the position is not used yet.


  // Compressor
  function LZBase62Compressor(options) {
    this._init(options);
  }

  LZBase62Compressor.prototype = {
    _init: function(options) {
      options || (options = {});

      this._data = null;
      this._table = null;
      this._result = null;
      this._onDataCallback = options.onData;
      this._onEndCallback = options.onEnd;
    },
    _createTable: function() {
      var table = createBuffer(8, TABLE_LENGTH);
      for (var i = 0; i < TABLE_LENGTH; i++) {
        table[i] = BASE62TABLE.charCodeAt(i);
      }
      return table;
    },
    _onData: function(buffer, length) {
      var data = bufferToString(buffer, length);

      if (this._onDataCallback) {
        this._onDataCallback(data);
      } else {
        this._result += data;
      }
    },
    _onEnd: function() {
      if (this._onEndCallback) {
        this._onEndCallback();
      }
      this._data = this._table = null;
    },
    // Searches for a longest match
    _search: function() {
      var i = 2;
      var data = this._data;
      var offset = this._offset;
      var len = BUFFER_MAX;
      if (this._dataLen - offset < len) {
        len = this._dataLen - offset;
      }
      if (i > len) {
        return false;
      }

      var pos = offset - WINDOW_BUFFER_MAX;
      var win = data.substring(pos, offset + len);
      var limit = offset + i - 3 - pos;
      var j, s, index, lastIndex, bestIndex;

      do {
        if (i === 2) {
          s = data.charAt(offset) + data.charAt(offset + 1);

          // Fast check by pre-match for the slow lastIndexOf.
          index = win.indexOf(s);
          if (!~index || index > limit) {
            break;
          }
        } else if (i === 3) {
          s = s + data.charAt(offset + 2);
        } else {
          s = data.substr(offset, i);
        }

        lastIndex = win.lastIndexOf(s, limit);
        if (!~lastIndex) {
          break;
        }

        bestIndex = lastIndex;
        j = pos + lastIndex;
        do {
          if (data.charCodeAt(offset + i) !== data.charCodeAt(j + i)) {
            break;
          }
        } while (++i < len);

        if (index === lastIndex) {
          i++;
          break;
        }

      } while (++i < len);

      if (i === 2) {
        return false;
      }

      this._index = WINDOW_BUFFER_MAX - bestIndex;
      this._length = i - 1;
      return true;
    },
    compress: function(data) {
      if (data == null || data.length === 0) {
        return '';
      }

      var result = '';
      var table = this._createTable();
      var win = createWindow();
      var buffer = createBuffer(8, COMPRESS_CHUNK_SIZE);
      var i = 0;

      this._result = '';
      this._offset = win.length;
      this._data = win + data;
      this._dataLen = this._data.length;
      win = data = null;

      var index = -1;
      var lastIndex = -1;
      var c, c1, c2, c3, c4;

      while (this._offset < this._dataLen) {
        if (!this._search()) {
          c = this._data.charCodeAt(this._offset++);
          if (c < LATIN_BUFFER_MAX) {
            if (c < UNICODE_CHAR_MAX) {
              c1 = c;
              c2 = 0;
              index = LATIN_INDEX;
            } else {
              c1 = c % UNICODE_CHAR_MAX;
              c2 = (c - c1) / UNICODE_CHAR_MAX;
              index = c2 + LATIN_INDEX;
            }

            // Latin index
            if (lastIndex === index) {
              buffer[i++] = table[c1];
            } else {
              buffer[i++] = table[index - LATIN_INDEX_START];
              buffer[i++] = table[c1];
              lastIndex = index;
            }
          } else {
            if (c < UNICODE_BUFFER_MAX) {
              c1 = c;
              c2 = 0;
              index = UNICODE_INDEX;
            } else {
              c1 = c % UNICODE_BUFFER_MAX;
              c2 = (c - c1) / UNICODE_BUFFER_MAX;
              index = c2 + UNICODE_INDEX;
            }

            if (c1 < UNICODE_CHAR_MAX) {
              c3 = c1;
              c4 = 0;
            } else {
              c3 = c1 % UNICODE_CHAR_MAX;
              c4 = (c1 - c3) / UNICODE_CHAR_MAX;
            }

            // Unicode index
            if (lastIndex === index) {
              buffer[i++] = table[c3];
              buffer[i++] = table[c4];
            } else {
              buffer[i++] = table[CHAR_START];
              buffer[i++] = table[index - TABLE_LENGTH];
              buffer[i++] = table[c3];
              buffer[i++] = table[c4];

              lastIndex = index;
            }
          }
        } else {
          if (this._index < BUFFER_MAX) {
            c1 = this._index;
            c2 = 0;
          } else {
            c1 = this._index % BUFFER_MAX;
            c2 = (this._index - c1) / BUFFER_MAX;
          }

          if (this._length === 2) {
            buffer[i++] = table[c2 + COMPRESS_FIXED_START];
            buffer[i++] = table[c1];
          } else {
            buffer[i++] = table[c2 + COMPRESS_START];
            buffer[i++] = table[c1];
            buffer[i++] = table[this._length];
          }

          this._offset += this._length;
          if (~lastIndex) {
            lastIndex = -1;
          }
        }

        if (i >= COMPRESS_CHUNK_MAX) {
          this._onData(buffer, i);
          i = 0;
        }
      }

      if (i > 0) {
        this._onData(buffer, i);
      }

      this._onEnd();
      result = this._result;
      this._result = null;
      return result === null ? '' : result;
    }
  };


  // Decompressor
  function LZBase62Decompressor(options) {
    this._init(options);
  }

  LZBase62Decompressor.prototype = {
    _init: function(options) {
      options || (options = {});

      this._result = null;
      this._onDataCallback = options.onData;
      this._onEndCallback = options.onEnd;
    },
    _createTable: function() {
      var table = {};
      for (var i = 0; i < TABLE_LENGTH; i++) {
        table[BASE62TABLE.charAt(i)] = i;
      }
      return table;
    },
    _onData: function(ended) {
      var data;

      if (this._onDataCallback) {
        if (ended) {
          data = this._result;
          this._result = null;
        } else {
          var len = DECOMPRESS_CHUNK_SIZE - WINDOW_MAX;

          data = this._result.substr(WINDOW_MAX, len);
          this._result = this._result.slice(0, WINDOW_MAX) +
                         this._result.substring(WINDOW_MAX + len);
        }

        if (data.length > 0) {
          this._onDataCallback(data);
        }
      }
    },
    _onEnd: function() {
      if (this._onEndCallback) {
        this._onEndCallback();
      }
    },
    decompress: function(data) {
      if (data == null || data.length === 0) {
        return '';
      }

      this._result = createWindow();
      var result = '';
      var table = this._createTable();

      var out = false;
      var index = null;
      var len = data.length;
      var offset = 0;

      var c, c2, c3;
      var code, pos, length, shrink, sub;

      for (; offset < len; offset++) {
        c = table[data.charAt(offset)];
        if (c === void 0) {
          throw new Error('Out of range in decompression');
        }

        if (c < DECODE_MAX) {
          if (!out) {
            // Latin index
            code = index * UNICODE_CHAR_MAX + c;
          } else {
            // Unicode index
            c3 = table[data.charAt(++offset)];
            code = c3 * UNICODE_CHAR_MAX + c + UNICODE_BUFFER_MAX * index;
          }
          this._result += fromCharCode(code);
        } else if (c < LATIN_DECODE_MAX) {
          // Latin starting point
          index = c - DECODE_MAX;
          out = false;
        } else if (c === CHAR_START) {
          // Unicode starting point
          c2 = table[data.charAt(++offset)];
          index = c2 - 5;
          out = true;
        } else if (c < COMPRESS_INDEX) {
          c2 = table[data.charAt(++offset)];

          if (c < COMPRESS_FIXED_START) {
            pos = (c - COMPRESS_START) * BUFFER_MAX + c2;
            length = table[data.charAt(++offset)];
          } else {
            pos = (c - COMPRESS_FIXED_START) * BUFFER_MAX + c2;
            length = 2;
          }

          sub = this._result.slice(-WINDOW_BUFFER_MAX)
            .slice(-pos).substring(0, length);

          if (sub) {
            shrink = '';
            while (shrink.length < length) {
              shrink += sub;
            }
            this._result += shrink.substring(0, length);
          }
          index = null;
        }

        if (this._result.length >= DECOMPRESS_CHUNK_MAX) {
          this._onData();
        }
      }

      this._result = this._result.substring(WINDOW_MAX);
      this._onData(true);

      this._onEnd();
      result = this._result;
      this._result = null;
      return result === null ? '' : result;
    }
  };


  // Create Sliding window
  function createWindow() {
    var alpha = 'abcdefghijklmnopqrstuvwxyz';
    var win = '';
    var len = alpha.length;
    var i, j, c, c2;

    for (i = 0; i < len; i++) {
      c = alpha.charAt(i);
      for (j = len - 1; j > 15 && win.length < WINDOW_MAX; j--) {
        c2 = alpha.charAt(j);
        win += ' ' + c + ' ' + c2;
      }
    }

    while (win.length < WINDOW_MAX) {
      win = ' ' + win;
    }
    win = win.slice(0, WINDOW_MAX);

    return win;
  }


  function truncateBuffer(buffer, length) {
    if (buffer.length === length) {
      return buffer;
    }

    if (buffer.subarray) {
      return buffer.subarray(0, length);
    }

    buffer.length = length;
    return buffer;
  }


  function bufferToString(buffer, length) {
    if (CAN_CHARCODE_APPLY && CAN_CHARCODE_APPLY_TYPED &&
        length < APPLY_BUFFER_SIZE) {
      try {
        return fromCharCode.apply(null, truncateBuffer(buffer, length));
      } catch (e) {
        // Ignore RangeError: arguments too large
      }
    }

    var string = '';
    for (var i = 0; i < length; i++) {
      string += fromCharCode(buffer[i]);
    }
    return string;
  }


  function createBuffer(bits, size) {
    if (!HAS_TYPED) {
      return new Array(size);
    }

    switch (bits) {
      case 8: return new Uint8Array(size);
      case 16: return new Uint16Array(size);
    }
  }


  /**
   * @name lzbase62
   * @type {Object}
   * @public
   * @class
   */
  var lzbase62 = {
    /**
     * @lends lzbase62
     */
    /**
     * Compress data to a base 62(0-9a-zA-Z) encoded string.
     *
     * @param {string|Buffer} data Input data
     * @param {Object=} [options] Options
     * @return {string} Compressed data
     */
    compress: function(data, options) {
      return new LZBase62Compressor(options).compress(data);
    },
    /**
     * Decompress data from a base 62(0-9a-zA-Z) encoded string.
     *
     * @param {string} data Input data
     * @param {Object=} [options] Options
     * @return {string} Decompressed data
     */
    decompress: function(data, options) {
      return new LZBase62Decompressor(options).decompress(data);
    }
  };

  return lzbase62;
}));
