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
