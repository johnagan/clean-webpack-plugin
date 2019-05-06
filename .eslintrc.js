'use strict';

const eslint = {
    extends: '@chrisblossom/eslint-config',
    overrides: [
        {
            files: ['dev-utils/**/*.js', 'dev-utils/**/.*.js'],
            parserOptions: {
                sourceType: 'script',
            },
            rules: {
                strict: ['error', 'safe'],
                'import/no-extraneous-dependencies': 'off',
                'node/no-unpublished-require': 'off',

                'node/no-unsupported-features/es-builtins': 'error',
                'node/no-unsupported-features/es-syntax': 'error',
                'node/no-unsupported-features/node-builtins': 'error',
            },
        },
    ],
};

module.exports = eslint;
