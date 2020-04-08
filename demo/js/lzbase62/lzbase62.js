/*!
 * lzbase62 v2.0.0 - LZ77(LZSS) based compression algorithm in base62 for JavaScript
 * Copyright (c) 2014-2020 polygon planet <polygon.planet.aqua@gmail.com>
 * https://github.com/polygonplanet/lzbase62
 * @license MIT
 */
(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.lzbase62 = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
module.exports={
  "version": "2.0.0"
}
},{}],2:[function(require,module,exports){
var config = require('./config');
var util = require('./util');

function Compressor(options) {
  this._init(options);
}

Compressor.prototype = {
  _init: function(options) {
    options = options || {};

    this._data = null;
    this._table = null;
    this._result = null;
    this._onDataCallback = options.onData;
    this._onEndCallback = options.onEnd;
  },
  _createTable: function() {
    var table = util.createBuffer(8, config.TABLE_LENGTH);
    for (var i = 0; i < config.TABLE_LENGTH; i++) {
      table[i] = config.BASE62TABLE.charCodeAt(i);
    }
    return table;
  },
  _onData: function(buffer, length) {
    var data = util.bufferToString_fast(buffer, length);

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
  // Search for a longest match
  _search: function() {
    var i = 2;
    var data = this._data;
    var offset = this._offset;
    var len = config.BUFFER_MAX;
    if (this._dataLen - offset < len) {
      len = this._dataLen - offset;
    }
    if (i > len) {
      return false;
    }

    var pos = offset - config.WINDOW_BUFFER_MAX;
    var win = data.substring(pos, offset + len);
    var limit = offset + i - 3 - pos;
    var j, s, index, lastIndex, bestIndex, winPart;

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

      if (config.STRING_LASTINDEXOF_BUG) {
        winPart = data.substring(pos, offset + i - 1);
        lastIndex = winPart.lastIndexOf(s);
      } else {
        lastIndex = win.lastIndexOf(s, limit);
      }

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

    this._index = config.WINDOW_BUFFER_MAX - bestIndex;
    this._length = i - 1;
    return true;
  },
  compress: function(data) {
    if (data == null || data.length === 0) {
      return '';
    }

    var result = '';
    var table = this._createTable();
    var win = util.createWindow();
    var buffer = util.createBuffer(8, config.COMPRESS_CHUNK_SIZE);
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
        if (c < config.LATIN_BUFFER_MAX) {
          if (c < config.UNICODE_CHAR_MAX) {
            c1 = c;
            c2 = 0;
            index = config.LATIN_INDEX;
          } else {
            c1 = c % config.UNICODE_CHAR_MAX;
            c2 = (c - c1) / config.UNICODE_CHAR_MAX;
            index = c2 + config.LATIN_INDEX;
          }

          // Latin index
          if (lastIndex === index) {
            buffer[i++] = table[c1];
          } else {
            buffer[i++] = table[index - config.LATIN_INDEX_START];
            buffer[i++] = table[c1];
            lastIndex = index;
          }
        } else {
          if (c < config.UNICODE_BUFFER_MAX) {
            c1 = c;
            c2 = 0;
            index = config.UNICODE_INDEX;
          } else {
            c1 = c % config.UNICODE_BUFFER_MAX;
            c2 = (c - c1) / config.UNICODE_BUFFER_MAX;
            index = c2 + config.UNICODE_INDEX;
          }

          if (c1 < config.UNICODE_CHAR_MAX) {
            c3 = c1;
            c4 = 0;
          } else {
            c3 = c1 % config.UNICODE_CHAR_MAX;
            c4 = (c1 - c3) / config.UNICODE_CHAR_MAX;
          }

          // Unicode index
          if (lastIndex === index) {
            buffer[i++] = table[c3];
            buffer[i++] = table[c4];
          } else {
            buffer[i++] = table[config.CHAR_START];
            buffer[i++] = table[index - config.TABLE_LENGTH];
            buffer[i++] = table[c3];
            buffer[i++] = table[c4];

            lastIndex = index;
          }
        }
      } else {
        if (this._index < config.BUFFER_MAX) {
          c1 = this._index;
          c2 = 0;
        } else {
          c1 = this._index % config.BUFFER_MAX;
          c2 = (this._index - c1) / config.BUFFER_MAX;
        }

        if (this._length === 2) {
          buffer[i++] = table[c2 + config.COMPRESS_FIXED_START];
          buffer[i++] = table[c1];
        } else {
          buffer[i++] = table[c2 + config.COMPRESS_START];
          buffer[i++] = table[c1];
          buffer[i++] = table[this._length];
        }

        this._offset += this._length;
        if (~lastIndex) {
          lastIndex = -1;
        }
      }

      if (i >= config.COMPRESS_CHUNK_MAX) {
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

module.exports = Compressor;

},{"./config":3,"./util":6}],3:[function(require,module,exports){
var HAS_TYPED = exports.HAS_TYPED = typeof Uint8Array !== 'undefined' && typeof Uint16Array !== 'undefined';

// Test for String.fromCharCode.apply
var CAN_CHARCODE_APPLY = false;
var CAN_CHARCODE_APPLY_TYPED = false;

try {
  if (String.fromCharCode.apply(null, [0x61]) === 'a') {
    CAN_CHARCODE_APPLY = true;
  }
} catch (e) {}

if (HAS_TYPED) {
  try {
    if (String.fromCharCode.apply(null, new Uint8Array([0x61])) === 'a') {
      CAN_CHARCODE_APPLY_TYPED = true;
    }
  } catch (e) {}
}

exports.CAN_CHARCODE_APPLY = CAN_CHARCODE_APPLY;
exports.CAN_CHARCODE_APPLY_TYPED = CAN_CHARCODE_APPLY_TYPED;

// Function.prototype.apply stack max range
var APPLY_BUFFER_SIZE = exports.APPLY_BUFFER_SIZE = 65533;
exports.APPLY_BUFFER_SIZE_OK = null;

// IE has bug of String.prototype.lastIndexOf when second argument specified
var STRING_LASTINDEXOF_BUG = false;
if ('abc\u307b\u3052'.lastIndexOf('\u307b\u3052', 1) !== -1) {
  STRING_LASTINDEXOF_BUG = true;
}
exports.STRING_LASTINDEXOF_BUG = STRING_LASTINDEXOF_BUG;


var BASE62TABLE = exports.BASE62TABLE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

// Buffers
var TABLE_LENGTH = exports.TABLE_LENGTH = BASE62TABLE.length;
var TABLE_DIFF = Math.max(TABLE_LENGTH, 62) - Math.min(TABLE_LENGTH, 62);
exports.BUFFER_MAX = TABLE_LENGTH - 1;
//var TABLE_BUFFER_MAX = BUFFER_MAX * (BUFFER_MAX + 1);

// Sliding Window
var WINDOW_MAX = exports.WINDOW_MAX = 1024;
exports.WINDOW_BUFFER_MAX = 304; // maximum 304

// Chunk buffer length
var COMPRESS_CHUNK_SIZE = exports.COMPRESS_CHUNK_SIZE = APPLY_BUFFER_SIZE;
exports.COMPRESS_CHUNK_MAX = COMPRESS_CHUNK_SIZE - TABLE_LENGTH;
var DECOMPRESS_CHUNK_SIZE = exports.DECOMPRESS_CHUNK_SIZE = APPLY_BUFFER_SIZE;
exports.DECOMPRESS_CHUNK_MAX = DECOMPRESS_CHUNK_SIZE + WINDOW_MAX * 2;

// Unicode table : U+0000 - U+0084
var LATIN_CHAR_MAX = 11;
exports.LATIN_BUFFER_MAX = LATIN_CHAR_MAX * (LATIN_CHAR_MAX + 1);

// Unicode table : U+0000 - U+FFFF
var UNICODE_CHAR_MAX = exports.UNICODE_CHAR_MAX = 40;
exports.UNICODE_BUFFER_MAX = UNICODE_CHAR_MAX * (UNICODE_CHAR_MAX + 1);

// Index positions
exports.LATIN_INDEX = TABLE_LENGTH + 1;
exports.LATIN_INDEX_START = TABLE_DIFF + 20;
exports.UNICODE_INDEX = TABLE_LENGTH + 5;

// Decode/Start positions
exports.DECODE_MAX = TABLE_LENGTH - TABLE_DIFF - 19;
var LATIN_DECODE_MAX = exports.LATIN_DECODE_MAX = UNICODE_CHAR_MAX + 7;
var CHAR_START = exports.CHAR_START = LATIN_DECODE_MAX + 1;
var COMPRESS_START = exports.COMPRESS_START = CHAR_START + 1;
var COMPRESS_FIXED_START = exports.COMPRESS_FIXED_START = COMPRESS_START + 5;
exports.COMPRESS_INDEX = COMPRESS_FIXED_START + 5; // 59
// Currently, 60 and 61 of the position is not used yet

},{}],4:[function(require,module,exports){
var config = require('./config');
var util = require('./util');

function Decompressor(options) {
  this._init(options);
}

Decompressor.prototype = {
  _init: function(options) {
    options = options || {};

    this._result = null;
    this._onDataCallback = options.onData;
    this._onEndCallback = options.onEnd;
  },
  _createTable: function() {
    var table = {};
    for (var i = 0; i < config.TABLE_LENGTH; i++) {
      table[config.BASE62TABLE.charAt(i)] = i;
    }
    return table;
  },
  _onData: function(ended) {
    var data;

    if (this._onDataCallback) {
      if (ended) {
        data = this._result;
        this._result = [];
      } else {
        var len = config.DECOMPRESS_CHUNK_SIZE - config.WINDOW_MAX;
        data = this._result.slice(config.WINDOW_MAX, config.WINDOW_MAX + len);
        this._result = this._result.slice(0, config.WINDOW_MAX).concat(this._result.slice(config.WINDOW_MAX + len));
      }
      if (data.length > 0) {
        this._onDataCallback(util.bufferToString_fast(data));
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

    this._result = util.stringToArray(util.createWindow());
    var result = '';
    var table = this._createTable();

    var out = false;
    var index = null;
    var len = data.length;
    var offset = 0;

    var i, c, c2, c3;
    var code, pos, length, sub, subLen, expandLen;

    for (; offset < len; offset++) {
      c = table[data.charAt(offset)];
      if (c === void 0) {
        continue;
      }

      if (c < config.DECODE_MAX) {
        if (!out) {
          // Latin index
          code = index * config.UNICODE_CHAR_MAX + c;
        } else {
          // Unicode index
          c3 = table[data.charAt(++offset)];
          code = c3 * config.UNICODE_CHAR_MAX + c + config.UNICODE_BUFFER_MAX * index;
        }
        this._result[this._result.length] = code;
      } else if (c < config.LATIN_DECODE_MAX) {
        // Latin starting point
        index = c - config.DECODE_MAX;
        out = false;
      } else if (c === config.CHAR_START) {
        // Unicode starting point
        c2 = table[data.charAt(++offset)];
        index = c2 - 5;
        out = true;
      } else if (c < config.COMPRESS_INDEX) {
        c2 = table[data.charAt(++offset)];

        if (c < config.COMPRESS_FIXED_START) {
          pos = (c - config.COMPRESS_START) * config.BUFFER_MAX + c2;
          length = table[data.charAt(++offset)];
        } else {
          pos = (c - config.COMPRESS_FIXED_START) * config.BUFFER_MAX + c2;
          length = 2;
        }

        sub = this._result.slice(-pos);
        if (sub.length > length) {
          sub.length = length;
        }
        subLen = sub.length;

        if (sub.length > 0) {
          expandLen = 0;
          while (expandLen < length) {
            for (i = 0; i < subLen; i++) {
              this._result[this._result.length] = sub[i];
              if (++expandLen >= length) {
                break;
              }
            }
          }
        }
        index = null;
      }

      if (this._result.length >= config.DECOMPRESS_CHUNK_MAX) {
        this._onData();
      }
    }

    this._result = this._result.slice(config.WINDOW_MAX);
    this._onData(true);
    this._onEnd();

    result = util.bufferToString_fast(this._result);
    this._result = null;
    return result;
  }
};

module.exports = Decompressor;

},{"./config":3,"./util":6}],5:[function(require,module,exports){
var Compressor = require('./compressor');
var Decompressor = require('./decompressor');

exports.version = require('../package.json').version;

/**
 * Compress data to a base 62(0-9a-zA-Z) encoded string
 *
 * @param {string} data Input data
 * @param {object} [options] Options
 * @return {string} Compressed data
 */
exports.compress = function(data, options) {
  return new Compressor(options).compress(data);
};

/**
 * Decompress data from a base 62(0-9a-zA-Z) encoded string
 *
 * @param {string} data Input data
 * @param {object} [options] Options
 * @return {string} Decompressed data
 */
exports.decompress = function(data, options) {
  return new Decompressor(options).decompress(data);
};

},{"../package.json":1,"./compressor":2,"./decompressor":4}],6:[function(require,module,exports){
var config = require('./config');
var fromCharCode = String.fromCharCode;

exports.createBuffer = function(bits, size) {
  if (!config.HAS_TYPED) {
    return new Array(size);
  }

  switch (bits) {
    case 8: return new Uint8Array(size);
    case 16: return new Uint16Array(size);
  }
};

var truncateBuffer = exports.truncateBuffer = function(buffer, length) {
  if (buffer.length === length) {
    return buffer;
  }

  if (buffer.subarray) {
    return buffer.subarray(0, length);
  }

  buffer.length = length;
  return buffer;
};

exports.bufferToString_fast = function(buffer, length) {
  if (length == null) {
    length = buffer.length;
  } else {
    buffer = truncateBuffer(buffer, length);
  }

  if (config.CAN_CHARCODE_APPLY && config.CAN_CHARCODE_APPLY_TYPED) {
    var len = buffer.length;
    if (len < config.APPLY_BUFFER_SIZE && config.APPLY_BUFFER_SIZE_OK) {
      return fromCharCode.apply(null, buffer);
    }

    if (config.APPLY_BUFFER_SIZE_OK === null) {
      try {
        var s = fromCharCode.apply(null, buffer);
        if (len > config.APPLY_BUFFER_SIZE) {
          config.APPLY_BUFFER_SIZE_OK = true;
        }
        return s;
      } catch (e) {
        // Ignore RangeError: arguments too large
        config.APPLY_BUFFER_SIZE_OK = false;
      }
    }
  }

  return bufferToString_chunked(buffer);
};

var bufferToString_chunked = exports.bufferToString_chunked = function(buffer) {
  var string = '';
  var length = buffer.length;
  var i = 0;
  var sub;

  while (i < length) {
    if (buffer.subarray) {
      sub = buffer.subarray(i, i + config.APPLY_BUFFER_SIZE);
    } else {
      sub = buffer.slice(i, i + config.APPLY_BUFFER_SIZE);
    }
    i += config.APPLY_BUFFER_SIZE;

    if (config.APPLY_BUFFER_SIZE_OK) {
      string += fromCharCode.apply(null, sub);
      continue;
    }

    if (config.APPLY_BUFFER_SIZE_OK === null) {
      try {
        string += fromCharCode.apply(null, sub);
        if (sub.length > config.APPLY_BUFFER_SIZE) {
          config.APPLY_BUFFER_SIZE_OK = true;
        }
        continue;
      } catch (e) {
        config.APPLY_BUFFER_SIZE_OK = false;
      }
    }

    return bufferToString_slow(buffer);
  }

  return string;
};

var bufferToString_slow = exports.bufferToString_slow = function(buffer) {
  var string = '';
  var length = buffer.length;

  for (var i = 0; i < length; i++) {
    string += fromCharCode(buffer[i]);
  }

  return string;
};

exports.stringToArray = function(string) {
  var array = [];
  var len = string && string.length;

  for (var i = 0; i < len; i++) {
    array[i] = string.charCodeAt(i);
  }

  return array;
};

// Sliding window
exports.createWindow = function() {
  var i = 8;
  var win = '        ';
  while (!(i & 1024)) {
    win += win;
    i <<= 1;
  }
  return win;
};

},{"./config":3}]},{},[5])(5)
});
