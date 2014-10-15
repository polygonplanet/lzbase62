/**
 * lzbase62
 *
 * @description  LZ77(LZSS) based compression algorithm in base62 for JavaScript.
 * @fileOverview Data compression library
 * @version      1.0.1
 * @date         2014-10-15
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

  var WINDOW_MAX = 3660;
  var BUFFER_MAX = 60;

  var table = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  function LZBase62() {
    this._data = null;
    this._offset = null;
    this._index = null;
    this._length = null;
  }

  LZBase62.prototype = {
    _createWindow: function() {
      return repeat(' ', WINDOW_MAX);
    },
    _search: function() {
      var index = -1;
      var win, s, s2, lastIndex;

      var sub = this._data.substr(this._offset, BUFFER_MAX);
      if (!sub) {
        return false;
      }

      for (var i = 2, len = sub.length; i <= len; i++) {
        s = sub.substring(0, i);
        win = this._data.substring(
          this._offset - WINDOW_MAX,
          this._offset + i - 1
        );

        lastIndex = win.lastIndexOf(s);
        if (~lastIndex) {
          while (i++ <= len) {
            s = sub.substring(0, i);
            s2 = this._data.substring(
              lastIndex + this._offset - WINDOW_MAX,
              lastIndex + this._offset - WINDOW_MAX + i
            );
            if (s !== s2) {
              break;
            }
          }
          i--;
          index = WINDOW_MAX - lastIndex;
        } else {
          break;
        }
      }

      this._index = index;
      this._length = i - 1;

      return true;
    },
    compress: function(data) {
      if (data == null) {
        return '';
      }

      var result = '';
      var c, c1, c2, c3, c4, next;

      var chars = table.split('');
      var win = this._createWindow();

      this._offset = win.length;
      this._data = win + data;
      win = data = null;

      for (;;) {
        next = this._search();
        if (!next) {
          break;
        }

        if (!~this._index) {
          c = this._data.charCodeAt(this._offset++);
          if (c < WINDOW_MAX) {
            c1 = c % BUFFER_MAX;
            c2 = (c - c1) / BUFFER_MAX;
            result += chars[c1] + chars[c2];
          } else {
            c1 = c % WINDOW_MAX;
            c2 = (c - c1) / WINDOW_MAX;
            c3 = c1 % BUFFER_MAX;
            c4 = (c1 - c3) / BUFFER_MAX;
            result += chars[BUFFER_MAX] + chars[c2] + chars[c3] + chars[c4];
          }
        } else {
          c1 = this._index % BUFFER_MAX;
          c2 = (this._index - c1) / BUFFER_MAX;
          result += chars[BUFFER_MAX + 1] +
            chars[c1] + chars[c2] + chars[this._length];
          this._offset += this._length;
        }
      }

      return result;
    },
    decompress: function(data) {
      if (data == null) {
        return '';
      }

      var result = this._createWindow();
      var i, len, c, c2, c3, code, index, length, buffer, sub;
      var out = false;
      var expand = false;

      var chars = {};
      for (i = 0, len = table.length; i < len; i++) {
        chars[table.charAt(i)] = i;
      }

      for (i = 0, len = data.length; i < len; i++) {
        c = chars[data.charAt(i)];
        if (c < BUFFER_MAX) {
          c2 = chars[data.charAt(++i)];
          if (!expand) {
            if (!out) {
              code = c2 * BUFFER_MAX + c;
            } else {
              c3 = chars[data.charAt(++i)];
              code = c3 * BUFFER_MAX + c2 + c * WINDOW_MAX;
              out = false;
            }
            result += fromCharCode(code);
          } else {
            index = c2 * BUFFER_MAX + c;
            length = chars[data.charAt(++i)];
            sub = result.slice(-WINDOW_MAX).slice(-index).substring(0, length);
            if (sub) {
              buffer = '';
              while (buffer.length < length) {
                buffer += sub;
              }
              result += buffer.substring(0, length);
            }
            expand = false;
          }
        } else if (c === BUFFER_MAX) {
          out = true;
        } else if (c === BUFFER_MAX + 1) {
          expand = true;
        }
      }

      return result.substring(WINDOW_MAX);
    }
  };


  // ES6 String.prototype.repeat - via SpiderMonkey
  // http://hg.mozilla.org/mozilla-central/file/01f04d75519d/js/src/builtin/String.js
  function repeat(string, count) {
    if (typeof String.prototype.repeat === 'function') {
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
