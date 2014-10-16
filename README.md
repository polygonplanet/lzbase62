lzbase62
========

[![Build Status](https://travis-ci.org/polygonplanet/lzbase62.svg)](https://travis-ci.org/polygonplanet/lzbase62)


LZ77(LZSS) based compression algorithm in base62 for JavaScript.

The compressed result will be a string in base 62 (0-9A-Za-z) characters.  
This is useful when storing the large data in a size limited storage (e.g., localStorage, cookie etc.).

## Installation

### In a browser:

```html
<script src="lzbase62.js"></script>
```

or

```html
<script src="lzbase62.min.js"></script>
```

The object named "lzbase62" will defined in the global scope.


### In Node.js:

```bash
npm install lzbase62
```

```javascript
var lzbase62 = require('lzbase62');
```

## Usage

* {_string_} lzbase62.**compress** ( {_string_} data )  
  Compress data to a base 62(0-9a-zA-Z) encoded string.  
  @param {_string_} _data_ Input data  
  @return {_string_} Compressed data  

* {_string_} lzbase62.**decompress** ( {_string_} data )  
  Decompress data from a base 62(0-9a-zA-Z) encoded string.  
  @param {_string_} _data_ Input data  
  @return {_string_} Decompressed data  

```javascript
var data = 'hello hello hello';
console.log(data.length); // 17

var compressed = lzbase62.compress(data);
console.log(compressed); // 'sBpBwBwBzB9GAM'
console.log(compressed.length); // 14
console.log(compressed.length < data.length); // true

var decompressed = lzbase62.decompress(compressed);
console.log(decompressed); // 'hello hello hello'
console.log(decompressed === data); // true
```

## Demo

[Demo](http://polygonplanet.github.io/lzbase62/demo/)

## License

MIT


