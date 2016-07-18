# Clean for webpack
A webpack plugin to remove/clean your build folder(s) before building

[![Build Status][travis-image]][travis-url]
[![Coveralls Status][coveralls-image]][coveralls-url]

## Installation
```
npm install clean-webpack-plugin --save-dev
```

## Example Webpack Config

``` javascript
var CleanWebpackPlugin = require('clean-webpack-plugin');

module.exports = {
  plugins: [
    new CleanWebpackPlugin(['dist', 'build'], {
      root: '/full/project/path',
      verbose: true, 
      dry: false,
      exclude: ['shared.js']
    })
  ]
}
```


## Usage
```javascript
new CleanWebpackPlugin(paths [, {options}])
```


### Paths (Required)
An [array] of string paths to clean
```javascript
['dist', 'build']
```

### Options and defaults (Optional)
```javascript
{
  "root": "[location of webpack.config]", // An absolute path for the root.
  "verbose": true, // Write logs to console.
  "dry": false, // Do not delete anything, good for testing.
  "exclude": ["files", "to", "ignore"] // Instead of removing whole path recursively,
                                       // remove all path's content with exclusion of provided immediate children.
                                       // Good for not removing shared files from build directories.
}
```


## License
http://www.opensource.org/licenses/mit-license.php

[travis-url]: https://travis-ci.org/johnagan/clean-webpack-plugin
[travis-image]: https://travis-ci.org/johnagan/clean-webpack-plugin.svg

[coveralls-url]: https://coveralls.io/github/johnagan/clean-webpack-plugin
[coveralls-image]: https://coveralls.io/repos/johnagan/clean-webpack-plugin/badge.svg
