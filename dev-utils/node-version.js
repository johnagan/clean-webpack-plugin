'use strict';

const readPkgUp = require('read-pkg-up');
const semver = require('semver');

function getNodeVersion() {
    const packageJson =
        readPkgUp.sync({ cwd: process.cwd(), normalize: false }).package || {};
    const engines = packageJson.engines || {};
    const node = engines.node || '10.0.0';

    const nodeVersion = semver.coerce(node).raw;

    return nodeVersion;
}

const nodeVersion = getNodeVersion();

module.exports = nodeVersion;
