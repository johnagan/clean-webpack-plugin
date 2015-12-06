# Clean for webpack
A webpack plugin to remove/clean your build folder(s) before building

## Installation
```
npm i clean-webpack-plugin --save
```

## Example Webpack Config

``` javascript
var Clean = require('clean-webpack-plugin');

module.exports = {
  plugins: [
    new Clean(['dist', 'build'])
  ]
}
```


## Parameters

#### new Clean(paths [, context])

* `paths` -  An array of string paths to clean
* `context` - The path root. By default uses ``webpack.config.js`` as root (optional)


## License
http://www.opensource.org/licenses/mit-license.php
