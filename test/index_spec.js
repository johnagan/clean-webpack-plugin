process.env.NODE_ENV = 'test';

var CleanWebpackPlugin = require('../index');
var expect = require('chai').expect;
var fs = require('fs');
var path = require('path');

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

var projectDir = path.resolve(__dirname, '../');
var tempRootDir = path.resolve(__dirname, '_temp');
var dirOne = path.resolve(tempRootDir, '_one');
var dirTwo = path.resolve(tempRootDir, '_two');

describe('clean-webpack-plugin', function() {
  var cleanWebpackPlugin;
  var result;
  var fakeRootDir;

  before(function() {
    createDir(tempRootDir);
  });

  it('nothing to clean', function() {
    cleanWebpackPlugin = new CleanWebpackPlugin();
    result = cleanWebpackPlugin.apply();

    expect(result).to.equal('nothing to clean');
  });

  it('project root must be an absolute path', function() {
    cleanWebpackPlugin = new CleanWebpackPlugin([tempRootDir], {root: '../'});
    result = cleanWebpackPlugin.apply();

    expect(result).to.equal('project root must be an absolute path');
  });

  it('project root is outside of project', function() {
    cleanWebpackPlugin = new CleanWebpackPlugin([tempRootDir], {root: '/test/dir'});
    result = cleanWebpackPlugin.apply();

    expect(result).to.equal('project root is outside of project');
  });

  it('must be inside the project root', function() {
    cleanWebpackPlugin = new CleanWebpackPlugin(['/fake/path'], {root: tempRootDir});
    result = cleanWebpackPlugin.apply();

    expect(result[0].output).to.equal('must be inside the project root');

    fakeRootDir = tempRootDir.slice(0, -2);
    cleanWebpackPlugin = new CleanWebpackPlugin([tempRootDir], {root: fakeRootDir});
    result = cleanWebpackPlugin.apply();

    expect(result[0].output).to.equal('must be inside the project root');
  });

  it('is equal to project root', function() {
    cleanWebpackPlugin = new CleanWebpackPlugin([tempRootDir], {root: tempRootDir});
    result = cleanWebpackPlugin.apply();

    expect(result[0].output).to.equal('is equal to project root');
  });

  it('would delete webpack', function() {
    cleanWebpackPlugin = new CleanWebpackPlugin(['./test'], {root: projectDir});
    result = cleanWebpackPlugin.apply();

    expect(result[0].output).to.equal('would delete webpack');
  });

  it('remove direct', function() {
    createDir(dirOne);
    cleanWebpackPlugin = new CleanWebpackPlugin(['_one'], {root: tempRootDir});
    result = cleanWebpackPlugin.apply();

    expect(result[0].output).to.equal('removed');
  });

  it('remove relative', function() {
    createDir(dirOne);
    cleanWebpackPlugin = new CleanWebpackPlugin(['./_one'], {root: tempRootDir});
    result = cleanWebpackPlugin.apply();

    expect(result[0].output).to.equal('removed');
  });

  it('remove absolute', function() {
    createDir(dirOne);
    cleanWebpackPlugin = new CleanWebpackPlugin([dirOne], {root: tempRootDir});
    result = cleanWebpackPlugin.apply();

    expect(result[0].output).to.equal('removed');
  });

  it('remove multiple', function() {
    createDir(dirOne);
    createDir(dirTwo);
    cleanWebpackPlugin = new CleanWebpackPlugin([dirOne, dirTwo], {root: tempRootDir});
    result = cleanWebpackPlugin.apply();

    expect(result[0].output).to.equal('removed');
    expect(result[1].output).to.equal('removed');
  });

  it('remove string', function() {
    createDir(dirOne);
    cleanWebpackPlugin = new CleanWebpackPlugin(dirOne, {root: tempRootDir});
    result = cleanWebpackPlugin.apply();

    expect(result[0].output).to.equal('removed');
  });

  it('context backwards compatibility ', function() {
    createDir(dirOne);
    cleanWebpackPlugin = new CleanWebpackPlugin(dirOne, tempRootDir);
    result = cleanWebpackPlugin.apply();

    expect(result[0].output).to.equal('removed');
  });

  it('options = {dry: true}', function() {
    createDir(dirOne);
    cleanWebpackPlugin = new CleanWebpackPlugin(dirOne, {root: tempRootDir, dry: true});
    result = cleanWebpackPlugin.apply();

    fs.statSync(dirOne);
    expect(result[0].output).to.equal('removed');
  });

  after(function() {
    cleanWebpackPlugin = new CleanWebpackPlugin(tempRootDir, {root: projectDir});
    cleanWebpackPlugin.apply();
  });
});

