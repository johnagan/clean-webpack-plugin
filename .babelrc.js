'use strict';

const nodeVersion = require('./dev-utils/node-version');

const babel = {
    presets: [
        [
            '@babel/preset-env',
            {
                targets: {
                    node: nodeVersion,
                },
            },
        ],
        '@babel/preset-typescript',
    ],
    plugins: [
        '@babel/plugin-proposal-class-properties',
        '@babel/plugin-transform-strict-mode',
    ],
    overrides: [
        {
            test: ['./src/clean-webpack-plugin.ts'],
            plugins: [
                [
                    'babel-plugin-add-module-exports',
                    { addDefaultProperty: true },
                ],
            ],
        },
    ],
};

module.exports = babel;
