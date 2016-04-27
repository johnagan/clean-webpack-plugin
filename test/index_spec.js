'use strict';
process.env.NODE_ENV = 'test';

var CleanWebpackPlugin = require('../index');
var path = require('path');
var tests = require('./tests');

describe('clean-webpack-plugin', function () {
  describe('native os', function () {
    this.CleanWebpackPlugin = CleanWebpackPlugin;

    this.filesystemRoot = path.resolve('/');

    // where project root is under the cwd
    this.projectDir = path.resolve(process.cwd());
    this.projectRoot = path.resolve(process.cwd(), 'test/project_root');
    this.dirOne = path.resolve(this.projectRoot, '_one');
    this.dirTwo = path.resolve(this.projectRoot, '_two');

    // where root is outside the cwd
    this.outsideProjectRoot = path.resolve(process.cwd(), 'test/outside_root');
    this.dirThree = path.resolve(this.outsideProjectRoot, 'three');

    var _this = this;
    var cleanWebpackPlugin;

    before(function () {
      tests.createDir(_this.projectRoot);
      tests.createDir(_this.outsideProjectRoot);
    });

    after(function () {
      cleanWebpackPlugin = new CleanWebpackPlugin([_this.projectRoot, _this.outsideProjectRoot], { root: _this.projectDir });
      cleanWebpackPlugin.apply();
    });

    tests.run(_this);
  });
});
