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
