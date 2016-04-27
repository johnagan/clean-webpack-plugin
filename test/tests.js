'use strict';
process.env.NODE_ENV = 'test';

var os = require('os');
var fs = require('fs');
var path = require('path');
var expect = require('chai').expect;

function createDir(directory) {
  try {
    fs.mkdirSync(directory);
  } catch (error) {
    if (error.code !== 'EEXIST') {
      throw new Error(error)
    }

    console.warn(directory, 'already exists. Did something go wrong?')
  }
}

function switchCaseRoot(dir, toCase) {
  var splitPath = dir.split(path.sep);
  splitPath[0] = splitPath[0][toCase]();
  return splitPath.join(path.sep);
}

var run = function (setup) {
  var _this = setup;

  describe('shared', function () {
    var CleanWebpackPlugin = _this.CleanWebpackPlugin;
    var projectDir = _this.projectDir;
    var projectRoot = _this.projectRoot;
    var outsideProjectRoot = _this.outsideProjectRoot;
    var filesystemRoot = _this.filesystemRoot;
    var dirOne = _this.dirOne;
    var dirTwo = _this.dirTwo;
    var dirThree = _this.dirThree;
    var platform = _this.platform || os.platform();
    var cleanWebpackPlugin;
    var result;

    it('nothing to clean', function () {
      cleanWebpackPlugin = new CleanWebpackPlugin();
      result = cleanWebpackPlugin.apply();

      expect(result[0].output).to.equal('nothing to clean');
    });

    it('project root must be an absolute path', function () {
      cleanWebpackPlugin = new CleanWebpackPlugin([projectRoot], { root: '../' });
      result = cleanWebpackPlugin.apply();

      expect(result[0].output).to.equal('project root must be an absolute path');
    });

    it('project root is outside of cwd', function () {
      cleanWebpackPlugin =
        new CleanWebpackPlugin([dirThree], { root: outsideProjectRoot });
      result = cleanWebpackPlugin.apply();

      expect(result[0].output).to.equal('removed');
    });

    it('must be inside the project root - bad path', function () {
      cleanWebpackPlugin = new CleanWebpackPlugin([dirThree], { root: projectRoot });
      result = cleanWebpackPlugin.apply();

      expect(result[0].output).to.equal('must be inside the project root');
    });

    it('must be inside the project root - good path', function () {
      cleanWebpackPlugin = new CleanWebpackPlugin([dirThree], { root: outsideProjectRoot });
      result = cleanWebpackPlugin.apply();

      expect(result[0].output).to.equal('removed');
    });

    it('is equal to project root', function () {
      cleanWebpackPlugin = new CleanWebpackPlugin([projectRoot], { root: projectRoot });
      result = cleanWebpackPlugin.apply();

      expect(result[0].output).to.equal('is equal to project root');
    });

    it('would delete webpack', function () {
      cleanWebpackPlugin = new CleanWebpackPlugin(['./test'], { root: projectDir });
      result = cleanWebpackPlugin.apply();

      expect(result[0].output).to.equal('would delete webpack');
    });


    it('remove direct', function () {
      createDir(dirOne);
      cleanWebpackPlugin = new CleanWebpackPlugin(['_one'], { root: projectRoot });
      result = cleanWebpackPlugin.apply();

      expect(result[0].output).to.equal('removed');
    });

    it('remove relative', function () {
      createDir(dirOne);
      cleanWebpackPlugin = new CleanWebpackPlugin(['./_one'], { root: projectRoot });
      result = cleanWebpackPlugin.apply();

      expect(result[0].output).to.equal('removed');
    });

    it('remove absolute', function () {
      createDir(dirOne);
      cleanWebpackPlugin = new CleanWebpackPlugin([dirOne], { root: projectRoot });
      result = cleanWebpackPlugin.apply();

      expect(result[0].output).to.equal('removed');
    });

    it('remove multiple', function () {
      createDir(dirOne);
      createDir(dirTwo);
      cleanWebpackPlugin = new CleanWebpackPlugin([dirOne, dirTwo], { root: projectRoot });
      result = cleanWebpackPlugin.apply();

      expect(result[0].output).to.equal('removed');
      expect(result[1].output).to.equal('removed');
    });

    it('remove string', function () {
      createDir(dirOne);
      cleanWebpackPlugin = new CleanWebpackPlugin(dirOne, { root: projectRoot });
      result = cleanWebpackPlugin.apply();

      expect(result[0].output).to.equal('removed');
    });

    it('context backwards compatibility ', function () {
      createDir(dirOne);
      cleanWebpackPlugin = new CleanWebpackPlugin(dirOne, projectRoot);
      result = cleanWebpackPlugin.apply();

      expect(result[0].output).to.equal('removed');
    });

    it('options = { dry: true }', function () {
      createDir(dirOne);
      cleanWebpackPlugin = new CleanWebpackPlugin(dirOne, { root: projectRoot, dry: true });
      result = cleanWebpackPlugin.apply();

      fs.statSync(dirOne);
      expect(result[0].output).to.equal('removed');
    });

    it('successful delete = { dry: true }', function () {
      cleanWebpackPlugin = new CleanWebpackPlugin(dirOne, { root: projectRoot, dry: true });
      result = cleanWebpackPlugin.apply();

      expect(result[0].output).to.equal('removed');
    });

    it('filesystem root', function () {
      cleanWebpackPlugin = new CleanWebpackPlugin([projectRoot],
        { root: filesystemRoot, dry: true });

      result = cleanWebpackPlugin.apply();
      expect(result[0].output).to.equal('removed');
    });

    if (platform === 'win32') {
      describe('windows only tests', function () {
        it('mixed case drive letters', function () {
          var lowerCaseProjectRoot = switchCaseRoot(projectRoot, 'toLowerCase');
          var upperCaseRimrafPath = switchCaseRoot(dirOne, 'toUpperCase');
          cleanWebpackPlugin = new CleanWebpackPlugin([upperCaseRimrafPath],
            { root: lowerCaseProjectRoot });

          result = cleanWebpackPlugin.apply();
          expect(result[0].output).to.equal('removed');
        });

        it('mixed case file paths', function () {
          var upperCaseprojectRoot = switchCaseRoot(projectRoot, 'toUpperCase');
          var lowerCaseRimrafPath = switchCaseRoot(dirOne, 'toLowerCase');
          cleanWebpackPlugin = new CleanWebpackPlugin([lowerCaseRimrafPath],
            { root: upperCaseprojectRoot });

          result = cleanWebpackPlugin.apply();
          expect(result[0].output).to.equal('removed');
        });
      });
    }
  });
};

module.exports = { run: run, createDir: createDir };