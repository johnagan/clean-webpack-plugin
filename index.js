var rimraf = require('rimraf');
var path = require('path');

// added node .10
// http://stackoverflow.com/questions/21698906/how-to-check-if-a-path-is-absolute-or-relative/30714706#30714706
function isAbsolute(p) {
  return path.normalize(p + '/') === path.normalize(path.resolve(p) + '/');
}

function Plugin(paths, options) {

  //backwards compatibility
  if (typeof options === 'string') {
    options = {
      root: options
    }
  }

  options = options || {};
  if (options.verbose === undefined) {
    if (process.env.NODE_ENV === 'test') {
      options.verbose = false;
    } else {
      options.verbose = true;
    }
  }

  if (options.dry === undefined) {
    options.dry = false;
  }

  // determine webpack root
  options.root = options.root || path.dirname(module.parent.filename);

  // allows for a single string entry
  if (typeof paths == 'string' || paths instanceof String) {
    paths = [paths];
  }

  // store paths and options
  this.paths = paths;
  this.options = options;
}

Plugin.prototype.apply = function(compiler) {
  var self = this;
  var results = [];
  var pathSplit;
  var insideFailCheck;

  // exit if no paths passed in
  if (self.paths === void 0) {
    return 'nothing to clean';
  }

  if (!isAbsolute(self.options.root)) {
    self.options.verbose && console.warn(
      'clean-webpack-plugin: ' + self.options.root + ' project root must be an absolute path. Skipping all...');
    return 'project root must be an absolute path';
  }

  var projectDir = path.resolve(self.options.root);
  var projectDirSplit = projectDir.split(path.sep);
  var webpackDir = path.dirname(module.parent.filename);

  // This is not perfect.
  if ((projectDir !== __dirname.slice(0, projectDir.length)) && (projectDir.indexOf(__dirname) === -1)) {
    self.options.verbose &&
    console.warn('clean-webpack-plugin: ' + self.options.root + ' project root is outside of project. Skipping all...');
    return 'project root is outside of project';
  }

  // preform an rm -rf on each path
  self.paths.forEach(function(rimrafPath) {
    rimrafPath = path.resolve(self.options.root, rimrafPath);

    pathSplit = rimrafPath.split(path.sep);
    projectDirSplit.forEach((function(singleDir, index) {
      if (pathSplit[index] !== singleDir) {
        insideFailCheck = true;
      }
    }));

    if (insideFailCheck) {
      self.options.verbose &&
      console.warn('clean-webpack-plugin: ' + rimrafPath + ' must be inside the project root. Skipping...');
      results.push({path: rimrafPath, output: 'must be inside the project root'});
      return;
    }

    // disallow deletion of project path and any directories outside of project path.
    if (rimrafPath.indexOf(projectDir) === 0) {
      if (rimrafPath === projectDir) {
        self.options.verbose &&
        console.warn('clean-webpack-plugin: ' + rimrafPath + ' is equal to project root. Skipping...');
        results.push({path: rimrafPath, output: 'is equal to project root'});
        return;
      }

      if (rimrafPath === webpackDir) {
        self.options.verbose &&
        console.warn('clean-webpack-plugin: ' + rimrafPath + ' would delete webpack. Skipping...');
        results.push({path: rimrafPath, output: 'would delete webpack'});
        return;
      }

      // If path is completely outside of the project. Should not be able to happen. Including as an extra fail-safe.
      if (projectDir.indexOf(rimrafPath) !== -1) {
        self.options.verbose &&
        console.warn('clean-webpack-plugin: ' + rimrafPath + ' is unsafe to delete. Skipping...');
        results.push({path: rimrafPath, output: 'is unsafe to delete'});
        return;
      }

      if (self.options.dry !== true) {
        rimraf.sync(rimrafPath);
      }

      self.options.verbose && console.warn('clean-webpack-plugin: ' + rimrafPath + ' has been removed.');
      results.push({path: rimrafPath, output: 'removed'});
    }
  });

  return results;
};

module.exports = Plugin;
