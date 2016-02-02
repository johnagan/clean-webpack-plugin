'use strict';

var os = require('os');
var path = require('path');
var rimraf = require('rimraf');

// added node .10
// http://stackoverflow.com/questions/21698906/how-to-check-if-a-path-is-absolute-or-relative/30714706#30714706
function isAbsolute(dir) {
  return path.normalize(dir + path.sep) === path.normalize(path.resolve(dir) + path.sep);
}

function upperCaseWindowsRoot(dir) {
  var splitPath = dir.split(path.sep);
  splitPath[0] = splitPath[0].toUpperCase();
  return splitPath.join(path.sep);
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

Plugin.prototype.apply = function (compiler) {
  var _this = this;
  var results = [];
  var insideFailCheck;
  var pathSplit;
  var workingDir;
  var projectRootDir;
  var webpackDir;
  var projectDirSplit;

  // exit if no paths passed in
  if (_this.paths === void 0) {
    results.push({ path: _this.paths, output: 'nothing to clean' });
    return results;
  }

  if (!isAbsolute(_this.options.root)) {
    _this.options.verbose && console.warn(
      'clean-webpack-plugin: ' + _this.options.root +
      ' project root must be an absolute path. Skipping all...');
    results.push({ path: _this.options.root, output: 'project root must be an absolute path' });
    return results;
  }

  workingDir = process.cwd();
  projectRootDir = path.resolve(_this.options.root);
  webpackDir = path.dirname(module.parent.filename);

  if (os.platform() === 'win32') {
    workingDir = upperCaseWindowsRoot(workingDir);
    projectRootDir = upperCaseWindowsRoot(projectRootDir);
    webpackDir = upperCaseWindowsRoot(webpackDir);
  }

  // This is not perfect.
  projectDirSplit = projectRootDir.split(path.sep);
  if ((projectRootDir !== workingDir.slice(0, projectRootDir.length)) &&
    (projectRootDir.indexOf(workingDir) === -1)) {
    _this.options.verbose &&
    console.warn('clean-webpack-plugin: ' + _this.options.root +
      ' project root is outside of project. Skipping all...');
    results.push({ path: projectRootDir, output: 'project root is outside of project' });
    return results;
  }

  // preform an rm -rf on each path
  _this.paths.forEach(function (rimrafPath) {
    rimrafPath = path.resolve(_this.options.root, rimrafPath);

    if (os.platform() === 'win32') {
      rimrafPath = upperCaseWindowsRoot(rimrafPath);
    }

    pathSplit = rimrafPath.split(path.sep);
    projectDirSplit.forEach((function (singleDir, index) {
      if (singleDir === '') {
        return;
      }

      if (pathSplit[index] !== singleDir) {
        insideFailCheck = true;
      }
    }));

    if (insideFailCheck) {
      _this.options.verbose &&
      console.warn(
        'clean-webpack-plugin: ' + rimrafPath + ' must be inside the project root. Skipping...');
      results.push({ path: rimrafPath, output: 'must be inside the project root' });
      return;
    }

    // disallow deletion of project path and any directories outside of project path.
    if (rimrafPath.indexOf(projectRootDir) === 0) {
      if (rimrafPath === projectRootDir) {
        _this.options.verbose &&
        console.warn(
          'clean-webpack-plugin: ' + rimrafPath + ' is equal to project root. Skipping...');
        results.push({ path: rimrafPath, output: 'is equal to project root' });
        return;
      }

      if (rimrafPath === webpackDir) {
        _this.options.verbose &&
        console.warn('clean-webpack-plugin: ' + rimrafPath + ' would delete webpack. Skipping...');
        results.push({ path: rimrafPath, output: 'would delete webpack' });
        return;
      }

      // If path is completely outside of the project. Should not be able to happen. Including as an extra fail-safe.
      if (projectRootDir.indexOf(rimrafPath) !== -1 || rimrafPath === __dirname ||
        rimrafPath === process.cwd()) {
        _this.options.verbose &&
        console.warn('clean-webpack-plugin: ' + rimrafPath + ' is unsafe to delete. Skipping...');
        results.push({ path: rimrafPath, output: 'is unsafe to delete' });
        return;
      }

      if (_this.options.dry !== true) {
        rimraf.sync(rimrafPath);
      }

      _this.options.verbose &&
      console.warn('clean-webpack-plugin: ' + rimrafPath + ' has been removed.');
      results.push({ path: rimrafPath, output: 'removed' });
    }
  });

  return results;
};

module.exports = Plugin;
