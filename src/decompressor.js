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
