lzbase62
========

LZ77(LZSS) based compression algorithm in base62 for JavaScript.

[![NPM Version](https://img.shields.io/npm/v/lzbase62.svg)](https://www.npmjs.com/package/lzbase62)
[![Build Status](https://travis-ci.org/polygonplanet/lzbase62.svg?branch=master)](https://travis-ci.org/polygonplanet/lzbase62)
[![Bundle Size (minified)](https://img.shields.io/github/size/polygonplanet/lzbase62/dist/lzbase62.min.js.svg)](https://github.com/polygonplanet/lzbase62/blob/master/dist/lzbase62.min.js)
[![GitHub License](https://img.shields.io/github/license/polygonplanet/lzbase62.svg)](https://github.com/polygonplanet/lzbase62/blob/master/LICENSE)

The compressed result will be a string in base 62 (0-9A-Za-z) characters.  
This is useful when storing large amounts of data in size-limited storage such as localStorage or cookies.

## Demo

* [Demo](http://polygonplanet.github.io/lzbase62/demo/)

## Installation

### npm

```bash
$ npm install --save lzbase62
```

## Usage

```javascript
var data = 'hello hello hello';
console.log(data.length); // 17

var compressed = lzbase62.compress(data);
console.log(compressed); // 'tYVccfrgxGL'
console.log(compressed.length); // 11
console.log(compressed.length < data.length); // true

var decompressed = lzbase62.decompress(compressed);
console.log(decompressed); // 'hello hello hello'
console.log(decompressed === data); // true
```

### node

```javascript
const lzbase62 = require('lzbase62');
const compressed = lzbase62.compress('hello hello hello');
```

### webpack etc.

```javascript
import lzbase62 from 'lzbase62';
const compressed = lzbase62.compress('hello hello hello');
```

### browser (standalone)

```html
<script src="lzbase62.min.js"></script>
<script>
var compressed = lzbase62.compress('hello hello hello');
</script>
```

Object **lzbase62** is defined in the global scope if running in the browser window. ( `window.lzbase62` )

## API

* [compress](#lzbase62compressdata-options)
* [decompress](#lzbase62decompressdata-options)

----

### lzbase62.compress(data, [options])

Compress data to a base62 `[0-9a-zA-Z]` encoded string.

#### Arguments

* **data** *(string)* : Input data
* **[options]** *(object)* : Compress options
  * **onData** *(function (data) {})* : Called when a data is chunked
  * **onEnd** *(function () {})* : Called when process is finished

#### Returns

*(string)* : Compressed data

#### Example

Compress string

```javascript
var compressed = lzbase62.compress('abcabcabcabcabc');
console.log(compressed); // 'tRSTxDM'
```

Compress data using onData events

```javascript
var string = 'hello hello hello';
var compressed = [];

lzbase62.compress(string, {
  onData: function(data) {
    compressed.push(data);
  },
  onEnd: function() {
    console.log(compressed.join('')); // 'tYVccfrgxGL'
  }
});
```

----

### lzbase62.decompress(data, [options])

Decompress data from a base62 `[0-9a-zA-Z]` encoded string.

#### Arguments

* **data** *(string)* : Input data
* **[options]** *(object)* : Decompress options
  * **onData** *(function (data) {})* : Called when a data is chunked
  * **onEnd** *(function () {})* : Called when process is finished

#### Returns

*(string)* : Decompressed data


#### Example

Decompress string

```javascript
var decompressed = lzbase62.decompress('tRSTxDM');
console.log(decompressed); // 'abcabcabcabcabc'
```

Decompress data using onData events

```javascript
var compressed = 'tYVccfrgxGL';
var decompressed = [];

lzbase62.decompress(compressed, {
  onData: function(data) {
    decompressed.push(data);
  },
  onEnd: function() {
    console.log(decompressed.join('')); // 'hello hello hello'
  }
});
```

## License

MIT
