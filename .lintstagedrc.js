'use strict';

const lintStaged = {
    '*.{js,mjs,jsx,ts,tsx,json,scss,less,css,md,yml,yaml}': [
        'prettier --write',
        'git add',
    ],
};

module.exports = lintStaged;
