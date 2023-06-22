lzbase62
========

[![NPM Version](https://img.shields.io/npm/v/lzbase62.svg)](https://www.npmjs.com/package/lzbase62)
[![GitHub Actions Build Status](https://github.com/polygonplanet/lzbase62/actions/workflows/ci.yml/badge.svg)](https://github.com/polygonplanet/lzbase62/actions)
[![Bundle Size (minified)](https://img.shields.io/github/size/polygonplanet/lzbase62/dist/lzbase62.min.js.svg)](https://github.com/polygonplanet/lzbase62/blob/master/dist/lzbase62.min.js)
[![GitHub License](https://img.shields.io/github/license/polygonplanet/lzbase62.svg)](https://github.com/polygonplanet/lzbase62/blob/master/LICENSE)

lzbase62 is a JavaScript library that compresses strings into ASCII strings composed solely of base62 (0-9, a-z, A-Z) characters, using the LZ77 based original algorithm.

It can compress and decompress any Unicode string that JavaScript can handle.

This can be particularly useful when storing large amounts of data in storage with size limitations, such as localStorage or cookies.
And, since the compressed strings are composed solely of base62 characters, they can be used as string parameters, like GET parameters, without the risk of control characters or symbols.

## Installation

### npm

```bash
$ npm install --save lzbase62
```

#### using `import`

```javascript
import lzbase62 from 'lzbase62';
```

#### using `require`

```javascript
const lzbase62 = require('lzbase62');
```

### browser (standalone)

You can install the library via npm or download it from the [release list](https://github.com/polygonplanet/lzbase62/tags). Use the `lzbase62.js` or `lzbase62.min.js` files included in the package.  
\*Please note that if you use `git clone`, even the *master* branch may be under development.

```html
<script src="lzbase62.js"></script>
```
or the minified `lzbase62.min.js`:

```html
<script src="lzbase62.min.js"></script>
```

When the script is loaded, the `lzbase62` object is defined in the global scope (i.e., `window.lzbase62`).

## Usage

Example of compressing and decompressing a string:

```javascript
const data = 'hello hello hello';
console.log(data.length); // 17

const compressed = lzbase62.compress(data);
console.log(compressed); // 'tYVccfrgxGL'
console.log(compressed.length); // 11

const decompressed = lzbase62.decompress(compressed);
console.log(decompressed); // 'hello hello hello'
console.log(decompressed === data); // true
```

## Demo

* [lzbase62 compression demo](https://polygonplanet.github.io/lzbase62/demo/)

## API

* [compress](#lzbase62compressdata-options)
* [decompress](#lzbase62decompressdata-options)

----

### lzbase62.compress(data, [options])

Compresses data into a base62 `[0-9a-zA-Z]` encoded string.

#### Arguments

* **data** *(string)* : Input data
* **[options]** *(object)* : Compression options
  * **onData** *(function (data) {})* : Called when a data is chunked
  * **onEnd** *(function () {})* : Called when process ends

#### Returns

*(string)* : Compressed data

#### Example

Example of compressing a string:

```javascript
const compressed = lzbase62.compress('abcabcabcabcabc');
console.log(compressed); // 'tRSTxDM'
```

Compresses data using `onData` and `onEnd` events:

```javascript
const string = 'hello hello hello';
const compressed = [];

lzbase62.compress(string, {
  onData: (data) => {
    compressed.push(data);
  },
  onEnd: () => {
    console.log(compressed.join('')); // 'tYVccfrgxGL'
  }
});
```

----

### lzbase62.decompress(data, [options])

Decompresses a string that has been compressed with [`lzbase62.compress()`](#lzbase62compressdata-options).

#### Arguments

* **data** *(string)* : Input data
* **[options]** *(object)* : Decompression options
  * **onData** *(function (data) {})* : Called when a data is chunked
  * **onEnd** *(function () {})* : Called when process ends

#### Returns

*(string)* : Decompressed data

#### Example

Example of decompressing a string that has been compressed with [`lzbase62.compress()`](#lzbase62compressdata-options):

```javascript
const decompressed = lzbase62.decompress('tRSTxDM');
console.log(decompressed); // 'abcabcabcabcabc'
```

Decompress data using `onData` and `onEnd` events:

```javascript
const compressed = 'tYVccfrgxGL';
const decompressed = [];

lzbase62.decompress(compressed, {
  onData: (data) => {
    decompressed.push(data);
  },
  onEnd: () => {
    console.log(decompressed.join('')); // 'hello hello hello'
  }
});
```

## Contributing

We welcome contributions from everyone.
For bug reports and feature requests, please [create an issue on GitHub](https://github.com/polygonplanet/lzbase62/issues).

### Pull Requests

Before submitting a pull request, please run `$ npm run test` to ensure there are no errors.
We only accept pull requests that pass all tests.

## License

This project is licensed under the terms of the MIT license.
See the [LICENSE](LICENSE) file for details.
