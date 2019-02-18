'use strict';

/**
 * https://jestjs.io/docs/en/configuration
 */
const jest = {
    testEnvironment: 'node',
    collectCoverage: false,
    setupFilesAfterEnv: ['<rootDir>/jest.setup-test.js'],
    coveragePathIgnorePatterns: [
        '<rootDir>/(.*/?)__sandbox__',
        '<rootDir>/dev-utils',
    ],
    testPathIgnorePatterns: ['<rootDir>/(.*/?)__sandbox__'],

    /**
     * Automatically reset mock state between every test.
     * Equivalent to calling jest.resetAllMocks() between each test.
     *
     * Sane default with resetModules: true because mocks need to be inside beforeEach
     * for them to work correctly
     *
     * https://jestjs.io/docs/en/configuration#resetmocks-boolean
     */
    resetMocks: true,

    /**
     *  The module registry for every test file will be reset before running each individual test.
     *  This is useful to isolate modules for every test so that local module state doesn't conflict between tests.
     *
     *  https://jestjs.io/docs/en/configuration#resetmodules-boolean
     */
    resetModules: true,

    /**
     * Equivalent to calling jest.restoreAllMocks() between each test.
     *
     * Resets jest.spyOn mocks only
     *
     * https://jestjs.io/docs/en/configuration#restoremocks-boolean
     */
    restoreMocks: true,
};

module.exports = jest;
