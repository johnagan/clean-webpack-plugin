'use strict';

const ignore = [
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/build/**',
    '!**/coverage/**',
    '!**/.git/**',
    '!**/.idea/**',
    '!**/.vscode/**',
    '!**/.cache/**',
    '!**/.DS_Store/**',
    '!**/flow-typed/**',
];

module.exports = (wallabyInitial) => {
    return {
        files: [
            ...ignore,
            { pattern: '*', instrument: false },
            { pattern: '.*', instrument: false },
            { pattern: '**/__sandbox__/**/*', instrument: false },
            { pattern: '**/__sandbox__/**/.*', instrument: false },
            '**/!(*.test).+(js|jsx|ts|tsx|mjs)',
            { pattern: '**/.*', instrument: false },
            { pattern: '**/!(*.test).*', instrument: false },
        ],

        tests: [
            ...ignore,
            '!**/__sandbox__/**',
            '**/*.test.+(js|jsx|ts|tsx|mjs)',
        ],

        compilers: {
            'src/**/*.+(js|jsx)': wallabyInitial.compilers.babel(),
            '**/*.+(ts|tsx)': wallabyInitial.compilers.babel(),
        },

        hints: {
            ignoreCoverage: /ignore coverage/,
        },

        env: {
            type: 'node',
            runner: 'node',
        },

        testFramework: 'jest',

        setup: (wallabySetup) => {
            /**
             * link node_modules inside wallaby's temp dir
             *
             * https://github.com/wallabyjs/public/issues/1663#issuecomment-389717074
             */
            const fs = require('fs');
            const path = require('path');
            const realModules = path.join(
                wallabySetup.localProjectDir,
                'node_modules',
            );
            const linkedModules = path.join(
                wallabySetup.projectCacheDir,
                'node_modules',
            );

            try {
                fs.symlinkSync(realModules, linkedModules, 'dir');
                // eslint-disable-next-line no-empty
            } catch (error) {}

            /**
             * https://github.com/wallabyjs/public/issues/1268#issuecomment-323237993
             *
             * reset to expected wallaby process.cwd
             */
            process.chdir(wallabySetup.projectCacheDir);

            process.env.NODE_ENV = 'test';
            const jestConfig = require('./jest.config.js');
            wallabySetup.testFramework.configure(jestConfig);
        },
    };
};
