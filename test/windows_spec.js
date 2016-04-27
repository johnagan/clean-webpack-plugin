'use strict';
process.env.NODE_ENV = 'test';

// node v0.10.x doesn't have path.win32. Skip windows emulation tests for v0.10.x.
if (process.version.substring(-1, 6) === 'v0.10.') {
  return;
}

var fs = require('fs');
var path = require('path');
var rewire = require('rewire');
var CleanWebpackPlugin = rewire('../index');
var tests = rewire('./tests');

function convertToWin32Path(dir) {
  var splitPath = dir.split(path.sep);
  if (splitPath[0] === '') {
    splitPath[0] = 'C:';
  }

  return splitPath.join(path.win32.sep);
}

describe('windows emulation', function () {
  this.processCwdWin32 = convertToWin32Path(process.cwd());
  this.projectDir = convertToWin32Path(process.cwd());
  this.projectRoot = convertToWin32Path(path.resolve(process.cwd(), './test/_temp'));
  this.outsideProjectRoot = convertToWin32Path(path.resolve('/test/dir'));
  this.filesystemRoot = convertToWin32Path(path.resolve(('/')));
  this.dirOne = path.win32.resolve(this.projectRoot + path.win32.sep + '_one');
  this.dirTwo = path.win32.resolve(this.projectRoot + path.win32.sep + '_two');
  this.dirThree = path.win32.resolve(this.outsideProjectRoot + path.win32.sep + '_three');
  this.CleanWebpackPlugin = CleanWebpackPlugin;
  this.platform = 'win32';
  var _this = this;
  var revertPluginRewire;
  var revertTestsRewire;

  beforeEach(function () {
    revertPluginRewire = CleanWebpackPlugin.__set__({
      'os.platform': function () {
        return 'win32'
      },
      'process.cwd': function () {
        return _this.processCwdWin32;
      },
      'module.parent.filename': path.win32.resolve(_this.processCwdWin32, './test/windows_spec.js'),
      'path.sep': path.win32.sep,
      'path.resolve': path.win32.resolve,
      'path.dirname': path.win32.dirname,
      'path.normalize': path.win32.normalize,
      'rimraf.sync': function () {
        return undefined;
      },
    });

    revertTestsRewire = tests.__set__({
      'createDir': function () {
        return true;
      },
      'fs.statSync': function () {
        return true;
      }
    });
  });

  afterEach(function () {
    revertTestsRewire();
    revertPluginRewire();
  });

  tests.run(_this);
});
