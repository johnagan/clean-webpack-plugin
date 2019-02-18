'use strict';

const husky = {
    hooks: {
        'pre-commit': 'npm run git-pre-commit',
        'pre-push': 'npm run git-pre-push',
    },
};

module.exports = husky;
