var config = require('./config');
var fromCharCode = String.fromCharCode;


function createBuffer(bits, size) {
  if (!config.HAS_TYPED) {
    return new Array(size);
  }

  switch (bits) {
    case 8: return new Uint8Array(size);
    case 16: return new Uint16Array(size);
  }
}
exports.createBuffer = createBuffer;


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
exports.truncateBuffer = truncateBuffer;


function bufferToString_fast(buffer, length) {
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
}
exports.bufferToString_fast = bufferToString_fast;


function bufferToString_chunked(buffer) {
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
}
exports.bufferToString_chunked = bufferToString_chunked;


function bufferToString_slow(buffer) {
  var string = '';
  var length = buffer.length;

  for (var i = 0; i < length; i++) {
    string += fromCharCode(buffer[i]);
  }

  return string;
}
exports.bufferToString_slow = bufferToString_slow;


function stringToArray(string) {
  var array = [];
  var len = string && string.length;

  for (var i = 0; i < len; i++) {
    array[i] = string.charCodeAt(i);
  }

  return array;
}
exports.stringToArray = stringToArray;


// Sliding window
function createWindow() {
  var alpha = 'abcdefghijklmnopqrstuvwxyz';
  var win = '';
  var len = alpha.length;
  var i, j, c, c2;

  for (i = 0; i < len; i++) {
    c = alpha.charAt(i);
    for (j = len - 1; j > 15 && win.length < config.WINDOW_MAX; j--) {
      c2 = alpha.charAt(j);
      win += ' ' + c + ' ' + c2;
    }
  }

  while (win.length < config.WINDOW_MAX) {
    win = ' ' + win;
  }
  win = win.slice(0, config.WINDOW_MAX);

  return win;
}
exports.createWindow = createWindow;
