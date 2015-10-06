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

The object named "**lzbase62**" will defined in the global scope.


### In Node.js:

```bash
npm install lzbase62
```

```javascript
var lzbase62 = require('lzbase62');
```

### bower:

```bash
bower install lzbase62
```

## Usage

* {_string_} lzbase62.**compress** ( data [, options ] )  
  Compress data to a base 62(0-9a-zA-Z) encoded string.  
  @param {_string_|_Buffer_} _data_ Input data  
  @param {_Object_=} [_options_] Options  
  @return {_string_} Compressed data

* {_string_} lzbase62.**decompress** ( data [, options ] )  
  Decompress data from a base 62(0-9a-zA-Z) encoded string.  
  @param {_string_} _data_ Input data  
  @param {_Object_=} [_options_] Options  
  @return {_string_} Decompressed data


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

#### Options

##### onData
Called when a data is chunked.

Receive a chunked string data.

##### onEnd
Called when process is finished.


##### Compress data using onData events

```javascript
var string = 'hello hello hello';
var compressed = [];
lzbase62.compress(string, {
  onData: function(data) {
    compressed.push(data);
  },
  onEnd: function() {
    console.log(compressed.join(''));
  }
});
```

##### Decompress data using onData events

```javascript
var decompressed = [];
lzbase62.decompress(compressed, {
  onData: function(data) {
    decompressed.push(data);
  },
  onEnd: function() {
    console.log(decompressed.join(''));
  }
});
```

## Demo

* [Demo](http://polygonplanet.github.io/lzbase62/demo/)

## License

MIT

