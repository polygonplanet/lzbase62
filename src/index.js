var Compressor = require('./compressor');
var Decompressor = require('./decompressor');

var lzbase62 = {

  /**
   * Compress data to a base 62(0-9a-zA-Z) encoded string
   *
   * @param {string|Buffer} data Input data
   * @param {Object=} [options] Options
   * @return {string} Compressed data
   */
  compress: function(data, options) {
    return new Compressor(options).compress(data);
  },

  /**
   * Decompress data from a base 62(0-9a-zA-Z) encoded string
   *
   * @param {string} data Input data
   * @param {Object=} [options] Options
   * @return {string} Decompressed data
   */
  decompress: function(data, options) {
    return new Decompressor(options).decompress(data);
  }
};

module.exports = lzbase62;
