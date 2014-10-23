/**
 * lzbase62
 *
 * @description  LZ77(LZSS) based compression algorithm in base62 for JavaScript.
 * @fileOverview Data compression library
 * @version      1.2.0
 * @date         2014-10-24
 * @link         https://github.com/polygonplanet/lzbase62
 * @copyright    Copyright (c) 2014 polygon planet <polygon.planet.aqua@gmail.com>
 * @license      Licensed under the MIT license.
 */

(function(name, context, factory) {

  // Supports UMD. AMD, CommonJS/Node.js and browser context
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else if (typeof define === 'function' && define.amd) {
    define(factory);
  } else {
    context[name] = factory();
  }

}('lzbase62', this, function() {
  'use strict';

  var fromCharCode = String.fromCharCode;

  var table = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  // Sliding Window
  var WINDOW_MAX = 1024;

  // Buffers
  var TABLE_LENGTH = table.length;
  var BUFFER_MAX = TABLE_LENGTH - 3;
  var TABLE_BUFFER_MAX = BUFFER_MAX * (BUFFER_MAX + 1);

  // Starting points
  var COMPRESS_START = table.length - 1;
  var CHAR_START = table.length - 2;

  // Unicode table : U+0000 - U+0084
  var LATIN_CHAR_MAX = 11;
  var LATIN_BUFFER_MAX = LATIN_CHAR_MAX * (LATIN_CHAR_MAX + 1);

  // Unicode table : U+0000 - U+FFFF
  var UNICODE_CHAR_MAX = 40;
  var UNICODE_BUFFER_MAX = UNICODE_CHAR_MAX * (UNICODE_CHAR_MAX + 1);


  function LZBase62() {
    this._data = null;
    this._offset = null;
    this._index = null;
    this._length = null;
    this._end = false;
  }

  LZBase62.prototype = {
    _createWindow: function() {
      return repeat(' ', WINDOW_MAX);
    },
    _search: function() {
      var sub = this._data.substr(this._offset, BUFFER_MAX);
      if (!sub) {
        this._end = true;
        return false;
      }

      var i = 4;
      var len = sub.length;
      if (len < i) {
        return false;
      }

      var s = sub.slice(0, i);
      var win = this._data.substring(
        this._offset - WINDOW_MAX,
        this._offset + i - 1
      );

      var lastIndex = win.lastIndexOf(s);
      if (!~lastIndex) {
        return false;
      }

      var pos = lastIndex + this._offset - WINDOW_MAX;
      var c, c2;

      while (++i <= len) {
        c = sub.charAt(i - 1);
        c2 = this._data.charAt(pos + i - 1);
        if (c !== c2) {
          break;
        }
      }

      this._index = WINDOW_MAX - lastIndex;
      this._length = i - 1;

      return true;
    },
    compress: function(data) {
      if (data == null) {
        return '';
      }

      var result = '';
      var c, c1, c2, c3, c4, found;

      var index, lastIndex;

      var chars = table.split('');
      var win = this._createWindow();

      this._offset = win.length;
      this._data = win + data;
      win = data = null;

      for (;;) {
        found = this._search();
        if (this._end) {
          break;
        }

        if (!found) {
          c = this._data.charCodeAt(this._offset++);
          if (c < LATIN_BUFFER_MAX) {
            c1 = c % UNICODE_CHAR_MAX;
            c2 = (c - c1) / UNICODE_CHAR_MAX;

            // Latin index
            index = c2 + TABLE_LENGTH + 1;
            if (lastIndex === index) {
              result += chars[c1];
            } else {
              result += chars[index - 20] + chars[c1];
              lastIndex = index;
            }
          } else {
            c1 = c % UNICODE_BUFFER_MAX;
            c2 = (c - c1) / UNICODE_BUFFER_MAX;
            c3 = c1 % UNICODE_CHAR_MAX;
            c4 = (c1 - c3) / UNICODE_CHAR_MAX;

            // Unicode index
            index = c2 + TABLE_LENGTH + 5;
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

          result += chars[COMPRESS_START] +
            chars[c1] + chars[c2] + chars[this._length];
          this._offset += this._length;

          index = null;
          lastIndex = -1;
        }
      }

      return result;
    },
    decompress: function(data) {
      if (data == null) {
        return '';
      }

      var result = this._createWindow();
      var i, len, c, c2, c3, code, pos, length, buffer, sub;
      var out = false;
      var index = null;

      var chars = {};
      for (i = 0, len = table.length; i < len; i++) {
        chars[table.charAt(i)] = i;
      }

      for (i = 0, len = data.length; i < len; i++) {
        c = chars[data.charAt(i)];
        if (c >= TABLE_LENGTH) {
          continue;
        }

        if (c < UNICODE_CHAR_MAX + 3) {
          if (!out) {
            // Latin index
            code = index * UNICODE_CHAR_MAX + c;
          } else {
            // Unicode index
            c3 = chars[data.charAt(++i)];
            code = c3 * UNICODE_CHAR_MAX + c + UNICODE_BUFFER_MAX * index;
          }
          result += fromCharCode(code);
        } else if (c < UNICODE_CHAR_MAX + 7) {
          // Latin starting point
          index = c - 43;
          out = false;
        } else if (c === CHAR_START) {
          // Unicode starting point
          c2 = chars[data.charAt(++i)];
          index = c2 - 5;
          out = true;
        } else if (c === COMPRESS_START) {
          c2 = chars[data.charAt(++i)];
          c3 = chars[data.charAt(++i)];
          pos = c3 * BUFFER_MAX + c2;
          length = chars[data.charAt(++i)];

          sub = result.slice(-WINDOW_MAX).slice(-pos).substring(0, length);
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

      return result.substring(WINDOW_MAX);
    }
  };

  // ES6 String.prototype.repeat - via SpiderMonkey
  // http://hg.mozilla.org/mozilla-central/file/01f04d75519d/js/src/builtin/String.js
  function repeat(string, count) {
    if (typeof string.repeat === 'function') {
      return string.repeat(count);
    }

    var result = '';

    for (;;) {
      if (count & 1) {
        result += string;
      }
      count >>= 1;
      if (count) {
        string += string;
      } else {
        break;
      }
    }

    return result;
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
     * @param {string} data Input data
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
