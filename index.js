var rimraf = require('rimraf');
var path = require('path');
var resolve = path.resolve;

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

  // exit if no paths passed in
  if(self.paths === void 0)
    return

  var projectDir = path.dirname(module.parent.filename)

  // preform an rm -rf on each path
  self.paths.forEach(function(path){
    path = resolve(self.context, path);

    // disallow deletion of project path and any directories outside of project path.
    if(path != projectDir && path.indexOf(projectDir) === 0){
      rimraf.sync(path);
    } else {
      console.warn("Clean webpack did not delete path: " + path);
    }
  });
};

module.exports = Plugin;
