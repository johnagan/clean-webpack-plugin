var rimraf = require('rimraf')
var path = require('path');
var join = path.join;

function Plugin(paths, context) {
  // determine webpack root
  this.context = context || path.dirname(module.parent.filename);

  // allows for a single string entry
  if (typeof paths == 'string' || paths instanceof String){
    paths = [paths];
  }

  // store paths
  this.paths = paths;
}

Plugin.prototype.apply = function(compiler) {
  var self = this;

  // preform an rm -rf on each path
  self.paths.forEach(function(path){
    var path = join(self.context, path);
    rimraf.sync(path);
  });
}

module.exports = Plugin;
