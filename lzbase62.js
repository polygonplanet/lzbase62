/**
 * lzbase62
 *
 * @description  LZ77(LZSS) based compression algorithm in base62 for JavaScript.
 * @fileOverview Data compression library
 * @version      1.4.0
 * @date         2014-11-21
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


  function LZBase62() {
    this.init();
  }

  LZBase62.prototype = {
    init: function() {
      this._data = null;
      this._offset = null;
      this._index = null;
      this._length = null;
    },
    _createWindow: function() {
      var alpha = BASE62TABLE.slice(26, 52);

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
    },
    // Searches for a longer match
    _search: function() {
      this._length = 0;

      var offset = this._offset;
      var sub = this._data.substr(offset, BUFFER_MAX);
      var len = sub.length;
      var pos = offset - WINDOW_BUFFER_MAX;

      var i = 2;
      var j, s, win, index;

      while (i <= len) {
        s = sub.substr(0, i);
        win = this._data.substring(pos, offset + i - 1);

        // Fast check by pre-match for the slow lastIndexOf.
        if (!~win.indexOf(s)) {
          break;
        }

        index = win.lastIndexOf(s);
        j = pos + index;

        while (i <= len) {
          if (sub.charCodeAt(i) !== this._data.charCodeAt(j + i)) {
            break;
          }
          i++;
        }

        this._index = WINDOW_BUFFER_MAX - index;
        this._length = i;
        i++;
      }

      if (this._length > 0) {
        return true;
      }

      return false;
    },
    compress: function(data) {
      if (data == null || data.length === 0) {
        return '';
      }

      var result = '';

      var chars = BASE62TABLE.split('');
      var win = this._createWindow();

      this._offset = win.length;
      this._data = win + data;
      win = data = null;

      var index = -1;
      var lastIndex = -2;

      var len = this._data.length;
      var c, c1, c2, c3, c4;

      while (this._offset < len) {
        if (!this._search()) {
          c = this._data.charCodeAt(this._offset++);
          if (c < LATIN_BUFFER_MAX) {
            c1 = c % UNICODE_CHAR_MAX;
            c2 = (c - c1) / UNICODE_CHAR_MAX;

            // Latin index
            index = c2 + LATIN_INDEX;
            if (lastIndex === index) {
              result += chars[c1];
            } else {
              result += chars[index - LATIN_INDEX_START] + chars[c1];
              lastIndex = index;
            }
          } else {
            c1 = c % UNICODE_BUFFER_MAX;
            c2 = (c - c1) / UNICODE_BUFFER_MAX;
            c3 = c1 % UNICODE_CHAR_MAX;
            c4 = (c1 - c3) / UNICODE_CHAR_MAX;

            // Unicode index
            index = c2 + UNICODE_INDEX;
            if (lastIndex === index) {
              result += chars[c3] + chars[c4];
            } else {
              result += chars[CHAR_START] +
                chars[index - TABLE_LENGTH] + chars[c3] + chars[c4];

              lastIndex = index;
            }
          }
        } else {
          c1 = this._index % BUFFER_MAX;
          c2 = (this._index - c1) / BUFFER_MAX;

          if (this._length === 2) {
            result += chars[c2 + COMPRESS_FIXED_START] + chars[c1];
          } else {
            result += chars[c2 + COMPRESS_START] +
              chars[c1] + chars[this._length];
          }

          this._offset += this._length;
          index = -1;
          lastIndex = -2;
        }
      }

      this._data = null;
      return result;
    },
    decompress: function(data) {
      if (data == null || data.length === 0) {
        return '';
      }

      var result = this._createWindow();

      var out = false;
      var index = null;

      var i, len, c, c2, c3;
      var code, pos, length, buffer, sub;

      var chars = {};
      for (i = 0, len = BASE62TABLE.length; i < len; i++) {
        chars[BASE62TABLE.charAt(i)] = i;
      }

      for (i = 0, len = data.length; i < len; i++) {
        c = chars[data.charAt(i)];
        if (c === void 0) {
          throw new Error('Out of range in decompression');
        }

        if (c < DECODE_MAX) {
          if (!out) {
            // Latin index
            code = index * UNICODE_CHAR_MAX + c;
          } else {
            // Unicode index
            c3 = chars[data.charAt(++i)];
            code = c3 * UNICODE_CHAR_MAX + c + UNICODE_BUFFER_MAX * index;
          }
          result += fromCharCode(code);
        } else if (c < LATIN_DECODE_MAX) {
          // Latin starting point
          index = c - DECODE_MAX;
          out = false;
        } else if (c === CHAR_START) {
          // Unicode starting point
          c2 = chars[data.charAt(++i)];
          index = c2 - 5;
          out = true;
        } else if (c < COMPRESS_INDEX) {
          c2 = chars[data.charAt(++i)];

          if (c < COMPRESS_FIXED_START) {
            pos = (c - COMPRESS_START) * BUFFER_MAX + c2;
            length = chars[data.charAt(++i)];
          } else {
            pos = (c - COMPRESS_FIXED_START) * BUFFER_MAX + c2;
            length = 2;
          }

          sub = result.slice(-WINDOW_BUFFER_MAX)
            .slice(-pos).substring(0, length);

          if (sub) {
            buffer = '';
            while (buffer.length < length) {
              buffer += sub;
            }
            buffer = buffer.substring(0, length);
            result += buffer;
          }
          index = null;
        }
      }

      result = result.substring(WINDOW_MAX);
      data = null;

      return result;
    }
  };


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
     * @return {string} Compressed data
     */
    compress: function(data) {
      return new LZBase62().compress(data);
    },
    /**
     * Decompress data from a base 62(0-9a-zA-Z) encoded string.
     *
     * @param {string} data Input data
     * @return {string} Decompressed data
     */
    decompress: function(data) {
      return new LZBase62().decompress(data);
    }
  };

  return lzbase62;
}));
