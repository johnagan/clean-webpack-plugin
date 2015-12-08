var rimraf = require('rimraf');
var path = require('path');

function Plugin(paths, context) {
  // determine webpack root
  this.context = context || path.dirname(module.parent.filename);

  // allows for a single string entry
  if (typeof paths == 'string' || paths instanceof String) {
    paths = [paths];
  }

  // store paths
  this.paths = paths;
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

  if (!path.isAbsolute(self.context)) {
    console.warn('clean-webpack-plugin: ' + self.context + ' project root must be an absolute path. Skipping all...');
    return 'project root must be an absolute path';
  }

  var projectDir = path.resolve(self.context);
  var projectDirSplit = projectDir.split('/');
  var webpackDir = path.dirname(module.parent.filename);

  // This is not perfect.
  if ((projectDir !== __dirname.slice(0, projectDir.length)) && (projectDir.indexOf(__dirname) === -1)) {
    console.warn('clean-webpack-plugin: ' + self.context + ' project root is outside of project. Skipping all...');
    return 'project root is outside of project';
  }

  // preform an rm -rf on each path
  self.paths.forEach(function(rimrafPath) {
    rimrafPath = path.resolve(self.context, rimrafPath);

    pathSplit = rimrafPath.split('/');
    projectDirSplit.forEach((function(singleDir, index) {
      if (pathSplit[index] !== singleDir) {
        insideFailCheck = true;
      }
    }));

    if (insideFailCheck) {
      console.warn('clean-webpack-plugin: ' + rimrafPath + ' must be inside the project root. Skipping...');
      results.push({path: rimrafPath, output: 'must be inside the project root'});
      return;
    }

    // disallow deletion of project path and any directories outside of project path.
    if (rimrafPath.indexOf(projectDir) === 0) {
      if (rimrafPath === projectDir) {
        console.warn('clean-webpack-plugin: ' + rimrafPath + ' is equal to project root. Skipping...');
        results.push({path: rimrafPath, output: 'is equal to project root'});
        return;
      }

      if (rimrafPath === webpackDir) {
        console.warn('clean-webpack-plugin: ' + rimrafPath + ' would delete webpack. Skipping...');
        results.push({path: rimrafPath, output: 'would delete webpack'});
        return;
      }

      // If path is completely outside of the project. Should not be able to happen. Including as an extra fail-safe.
      if (projectDir.indexOf(rimrafPath) !== -1) {
        console.warn('clean-webpack-plugin: ' + rimrafPath + ' is unsafe to delete. Skipping...');
        results.push({path: rimrafPath, output: 'is unsafe to delete'});
        return;
      }

      rimraf.sync(rimrafPath);
      results.push({path: rimrafPath, output: 'removed'});
    }
  });

  return results;
};

module.exports = Plugin;
