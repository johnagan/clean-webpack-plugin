'use strict';

var fs = require('fs');
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

Plugin.prototype.apply = function () {
  var _this = this;
  var results = [];
  var workingDir;
  var dirName;
  var projectRootDir;
  var webpackDir;

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
  dirName = __dirname;
  projectRootDir = path.resolve(_this.options.root);
  webpackDir = path.dirname(module.parent.filename);

  if (os.platform() === 'win32') {
    workingDir = upperCaseWindowsRoot(workingDir);
    dirName = upperCaseWindowsRoot(dirName);
    projectRootDir = upperCaseWindowsRoot(projectRootDir);
    webpackDir = upperCaseWindowsRoot(webpackDir);
  }

  // preform an rm -rf on each path
  _this.paths.forEach(function (rimrafPath) {
    rimrafPath = path.resolve(_this.options.root, rimrafPath);

    if (os.platform() === 'win32') {
      rimrafPath = upperCaseWindowsRoot(rimrafPath);
    }

    // disallow deletion any directories outside of root path.
    if (rimrafPath.indexOf(projectRootDir) < 0) {
      _this.options.verbose && console.warn(
        'clean-webpack-plugin: ' + rimrafPath + ' is outside of the project root. Skipping...');
      results.push({ path: rimrafPath, output: 'must be inside the project root' });
      return;
    }

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

    if (rimrafPath === dirName || rimrafPath === workingDir) {
      _this.options.verbose &&
      console.log('clean-webpack-plugin: ' + rimrafPath + ' is working directory. Skipping...');
      results.push({ path: rimrafPath, output: 'is working directory' });
      return;
    }

    var childrenAfterExcluding = [];
    var excludedChildren = [];

    if(_this.options.exclude && _this.options.exclude.length) {
      try {
        var pathStat = fs.statSync(rimrafPath);
        if (pathStat.isDirectory()) {
          childrenAfterExcluding = fs.readdirSync(rimrafPath)
              .filter(function (childFile) {
                var include = _this.options.exclude.indexOf(childFile) < 0;
                if (!include) {
                  excludedChildren.push(childFile);
                }
                return include;
              })
              .map(function (file) {
                var fullPath = path.join(rimrafPath, file);
                if (os.platform() === 'win32') {
                  fullPath = upperCaseWindowsRoot(fullPath);
                }
                return fullPath;
              });
        }
      } catch (e) {
        childrenAfterExcluding = [];
      }
    }

    if (_this.options.dry !== true) {
      if (_this.options.exclude && excludedChildren.length) {
        childrenAfterExcluding.forEach(function (child) {
          rimraf.sync(child);
        });
      } else {
        rimraf.sync(rimrafPath);
      }
    }

    _this.options.verbose &&
    console.warn('clean-webpack-plugin: ' + rimrafPath + ' has been removed.');
    _this.options.verbose && excludedChildren.length &&
    console.warn('clean-webpack-plugin: ' + excludedChildren.length + ' file(s) excluded - ' + excludedChildren.join(', '));

    excludedChildren.length ?
        results.push({ path: rimrafPath, output: 'removed with exclusions (' + excludedChildren.length + ')'}) :
        results.push({ path: rimrafPath, output: 'removed' });
  });

  return results;
};

module.exports = Plugin;
