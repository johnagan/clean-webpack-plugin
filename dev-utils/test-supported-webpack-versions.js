#!/usr/bin/env node

/* eslint-disable no-param-reassign,no-console */

'use strict';

const execa = require('execa');
const Listr = require('listr');
const del = require('del');
const readPkgUp = require('read-pkg-up');
const getWebpackVersion = require('./get-webpack-version');

const ciEnabled = process.argv[process.argv.length - 1] === '--ci';

const supported = [
    //
    '3',
    '4',
    'next',
];

const webpackTestTasks = supported.map((version) => {
    const skip = () => {
        /**
         * Webpack version 5 (currently @next) removed support for node 6.
         */
        // if (
        //     (version === 'next' || version === '5') &&
        //     semver.lte(process.version, '8.0.0') === true
        // ) {
        //     return `node ${
        //         process.version
        //     } is not supported by webpack@${version}...node >=8 required`;
        // }

        return false;
    };

    const npmCommandArgs = ['install', '--no-save', `webpack@${version}`];
    const npmInstallTaskTitle = `npm ${npmCommandArgs.join(' ')}`;
    const npmInstallTask = {
        title: npmInstallTaskTitle,
        task: async (ctx, task) => {
            await execa('npm', npmCommandArgs);
            task.title = `${npmInstallTaskTitle} (${getWebpackVersion()})`;
        },
    };

    const jestCommandArgs =
        ciEnabled === true
            ? ['--ci', '--no-cache', '--coverage', '--max-workers', '2']
            : [];

    const runJestTask = {
        title: `jest ${jestCommandArgs.join(' ')}`,
        task: () => {
            if (ciEnabled === true) {
                del.sync('coverage/**/*', { dot: true });
            }

            return execa('jest', jestCommandArgs, {
                env: { FORCE_COLOR: true },
            });
        },
    };

    const testWebpackVersionTask = [npmInstallTask, runJestTask];

    if (ciEnabled === true) {
        const codecovTask = {
            title: 'codecov',
            task: async () => {
                const { stdout } = await execa('codecov', [], {
                    env: { FORCE_COLOR: true },
                });

                console.log(stdout);
            },
        };

        testWebpackVersionTask.push(codecovTask);
    }

    return {
        title: `webpack@${version}`,
        task: () => {
            return new Listr(testWebpackVersionTask);
        },
        skip,
    };
});

const listrOptions =
    ciEnabled === false
        ? { collapse: false, clearOutput: false }
        : { renderer: 'verbose' };

const tasks = new Listr(webpackTestTasks, listrOptions);

tasks
    .run()
    .then(() => {
        /**
         * Install original webpack devDependency listed in package.json
         */
        const packageJsonWebpackVersion = readPkgUp.sync({
            cwd: process.cwd(),
            normalize: false,
        }).packageJson.devDependencies.webpack;

        return new Listr(
            [
                {
                    title: `npm install --no-save webpack@${packageJsonWebpackVersion}`,
                    task: () => {
                        return execa(
                            'npm',
                            [
                                'install',
                                '--no-save',
                                `webpack@${packageJsonWebpackVersion}`,
                            ],
                            { env: { FORCE_COLOR: true } },
                        );
                    },
                    skip: () => {
                        return ciEnabled === true;
                    },
                },
            ],
            listrOptions,
        ).run();
    })
    .catch((error) => {
        console.error(error.message);

        // eslint-disable-next-line no-process-exit
        process.exit(error.code);
    });
