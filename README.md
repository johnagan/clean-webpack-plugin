# Clean for webpack
A webpack plugin to remove/clean your build folder(s) before building

#### new Clean(paths, context)
| Parameter | Description | Example |
|-----------|-------------|---------|
| paths     | An array of string paths to clean | ['dist', 'build'] |
| context (optional)   | The path root. By default uses ``webpack.config.js`` as root | './root' |

## Example

``` javascript
var Clean = require('clean-webpack-plugin');

module.exports = {
  plugins: [
    new Clean(['dist', 'build'])
  ]
}
```

## License
http://www.opensource.org/licenses/mit-license.php
