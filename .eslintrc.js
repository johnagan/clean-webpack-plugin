'use strict';

const eslint = {
    extends: '@chrisblossom/eslint-config',
    rules: {
        'import/no-extraneous-dependencies': 'off',
    },
    overrides: [
        {
            files: ['*.ts', '*.tsx', '.*.ts', '.*.tsx'],
            rules: {
                'promise/prefer-await-to-then': 'off',
                'promise/always-return': 'off',
                '@typescript-eslint/promise-function-async': 'off',
                '@typescript-eslint/explicit-function-return-type': 'off',
            },
        },
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
