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
  var i = config.WINDOW_MAX >> 7;
  var win = '        ';
  while (!(i & config.WINDOW_MAX)) {
    win += win;
    i <<= 1;
  }
  return win;
};
