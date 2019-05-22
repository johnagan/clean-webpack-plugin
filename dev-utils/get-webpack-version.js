// @ts-ignore

'use strict';

const path = require('path');
const readPkgUp = require('read-pkg-up');

function getWebpackVersion() {
    const webpackPath = require.resolve('webpack');
    const { dir } = path.parse(webpackPath);

    const webpackPackageJson = readPkgUp.sync({ cwd: dir, normalize: false });

    const version = webpackPackageJson.package.version
        ? webpackPackageJson.package.version
        : null;

    return version;
}

module.exports = getWebpackVersion;
