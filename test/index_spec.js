'use strict';
process.env.NODE_ENV = 'test';

var CleanWebpackPlugin = require('../index');
var path = require('path');
var tests = require('./tests');

describe('clean-webpack-plugin', function () {
  describe('native os', function () {
    this.CleanWebpackPlugin = CleanWebpackPlugin;
    this.projectDir = path.resolve(process.cwd());
    this.tempRootDir = path.resolve(process.cwd(), './test/_temp');
    this.outsideProjectDir = path.resolve('/test/dir');
    this.filesystemRoot = path.resolve('/');
    this.dirOne = path.resolve(this.tempRootDir, '_one');
    this.dirTwo = path.resolve(this.tempRootDir, '_two');
    var _this = this;
    var cleanWebpackPlugin;

    before(function () {
      tests.createDir(_this.tempRootDir);
    });

    after(function () {
      cleanWebpackPlugin = new CleanWebpackPlugin(_this.tempRootDir, { root: _this.projectDir });
      cleanWebpackPlugin.apply();
    });

    tests.run(_this);
  });
});
