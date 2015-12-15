# Clean for webpack
A webpack plugin to remove/clean your build folder(s) before building

[![Build Status][travis-image]][travis-url]
[![Coveralls Status][coveralls-image]][coveralls-url]

## Installation
```
npm i clean-webpack-plugin --save
```

## Example Webpack Config

``` javascript
var CleanWebpackPlugin = require('clean-webpack-plugin');

module.exports = {
  plugins: [
    new cleanWebpackPlugin(['dist', 'build'], { root: '/full/project/path', verbose: true, dry: false })
  ]
}
```


## Parameters

#### new CleanWebpackPlugin(paths [, {options}])

* `paths` -  An [array] of string paths to clean
* `options` - An {object} containing optional params. See below. (optional)
#
* `options.root`: The path root. Must be an absolute path. string. default: use ``webpack.config.js`` path location as root 
* `options.verbose`: Write logs to console. boolean. default: true (recommended)
* `options.dry`: Do not delete anything, good for testing. boolean. default: false


## License
http://www.opensource.org/licenses/mit-license.php

[travis-url]: https://travis-ci.org/johnagan/clean-webpack-plugin
[travis-image]: https://travis-ci.org/johnagan/clean-webpack-plugin.svg

[coveralls-url]: https://coveralls.io/github/johnagan/clean-webpack-plugin
[coveralls-image]: https://coveralls.io/repos/johnagan/clean-webpack-plugin/badge.svg
