'use strict';

const readPkgUp = require('read-pkg-up');
const semver = require('semver');

function getNodeVersion() {
    const pkg =
        readPkgUp.sync({ cwd: process.cwd(), normalize: false }).pkg || {};
    const engines = pkg.engines || {};
    const node = engines.node || '8.9.0';

    const nodeVersion = semver.coerce(node).raw;

    return nodeVersion;
}

const nodeVersion = getNodeVersion();

module.exports = nodeVersion;
