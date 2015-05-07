# Clean for webpack
A webpack plugin to remove/clean your build folder(s) before building

## `new Clean(paths, context)`
* **Parameters**
    - **paths**: Array of paths *(example: ['dist', 'build'])*  
    - **context**: root path, by default uses path where located *webpack.config.js* 

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

MIT (http://www.opensource.org/licenses/mit-license.php)