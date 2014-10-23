/**
 * lzbase62
 *
 * @description  LZ77(LZSS) based compression algorithm in base62 for JavaScript.
 * @fileOverview Data compression library
 * @version      1.1.1
 * @date         2014-10-23
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

  var WINDOW_MAX = 1024;
  var BUFFER_MAX = table.length - 3;
  var TABLE_MAX = BUFFER_MAX * (BUFFER_MAX + 1);

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
      if (sub.length < i) {
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
      var index = null;
      var out = false;

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
          if (c < TABLE_MAX) {
            c1 = c % BUFFER_MAX;
            c2 = (c - c1) / BUFFER_MAX;

            if (!out && index === c2) {
              result += chars[c1];
            } else {
              index = c2;
              result += chars[BUFFER_MAX] + chars[c1] + chars[c2];

              out = false;
            }
          } else {
            c1 = c % TABLE_MAX;
            c2 = (c - c1) / TABLE_MAX;
            c3 = c1 % BUFFER_MAX;
            c4 = (c1 - c3) / BUFFER_MAX;

            if (out && index === c2) {
              result += chars[c3] + chars[c4];
            } else {
              index = c2;
              result += chars[BUFFER_MAX + 1] +
                chars[c2] + chars[c3] + chars[c4];

              out = true;
            }
          }
        } else {
          c1 = this._index % BUFFER_MAX;
          c2 = (this._index - c1) / BUFFER_MAX;

          result += chars[BUFFER_MAX + 2] +
            chars[c1] + chars[c2] + chars[this._length];

          index = null;
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
      var i, len, c, c2, c3, code, pos, length, buffer, sub;
      var out = false;
      var expand = false;
      var index = null;

      var chars = {};
      for (i = 0, len = table.length; i < len; i++) {
        chars[table.charAt(i)] = i;
      }

      for (i = 0, len = data.length; i < len; i++) {
        c = chars[data.charAt(i)];
        if (c < BUFFER_MAX) {
          if (!expand) {
            if (!out) {
              if (index === null) {
                index = chars[data.charAt(++i)];
              }
              code = index * BUFFER_MAX + c;
            } else {
              c3 = chars[data.charAt(++i)];
              code = c3 * BUFFER_MAX + c + index * TABLE_MAX;
            }
            result += fromCharCode(code);
          } else {
            c2 = chars[data.charAt(++i)];
            pos = c2 * BUFFER_MAX + c;
            length = chars[data.charAt(++i)];
            sub = result.slice(-WINDOW_MAX).slice(-pos).substring(0, length);
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
          out = false;
          index = null;
        } else if (c === BUFFER_MAX + 1) {
          out = true;
          index = chars[data.charAt(++i)];
        } else if (c === BUFFER_MAX + 2) {
          expand = true;
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
