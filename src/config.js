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
