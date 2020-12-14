import path from 'path';
import { sync as delSync } from 'del';
import { Compiler, Stats, compilation as compilationType } from 'webpack';
import fs from 'fs';

type Compilation = compilationType.Compilation;

export interface Options {
    /**
     * Simulate the removal of files
     *
     * default: false
     */
    dry?: boolean;

    /**
     * Write Logs to Console
     * (Always enabled when dry is true)
     *
     * default: false
     */
    verbose?: boolean;

    /**
     * Automatically remove all unused webpack assets on rebuild
     *
     * default: true
     */
    cleanStaleWebpackAssets?: boolean;

    /**
     * Do not allow removal of current webpack assets
     *
     * default: true
     */
    protectWebpackAssets?: boolean;

    /**
     * Removes files once prior to Webpack compilation
     *   Not included in rebuilds (watch mode)
     *
     * Use !negative patterns to exclude files
     *
     * default: ['**\/*']
     */
    cleanOnceBeforeBuildPatterns?: string[];

    /**
     * Removes files after every build (including watch mode) that match this pattern.
     * Used for files that are not created directly by Webpack.
     *
     * Use !negative patterns to exclude files
     *
     * default: []
     */
    cleanAfterEveryBuildPatterns?: string[];

    /**
     * Allow clean patterns outside of process.cwd()
     *
     * requires dry option to be explicitly set
     *
     * default: false
     */
    dangerouslyAllowCleanPatternsOutsideProject?: boolean;

    preserve?: PreserveOption;
}

export interface PreserveOption {
    maxAge: number;
    /**
     * default: 'cwp-stats.json'
     */
    filename?: string;
    /**
     * default: output.path
     */
    path?: string;
}

interface StatsSchemaItem {
    date: string;
    assets: string[];
}

interface StatsSchema {
    data: StatsSchemaItem[];
}

// Copied from https://github.com/sindresorhus/is-plain-obj/blob/97480673cf12145b32ec2ee924980d66572e8a86/index.js
function isPlainObject(value: unknown): boolean {
    if (Object.prototype.toString.call(value) !== '[object Object]') {
        return false;
    }

    const prototype = Object.getPrototypeOf(value);
    return prototype === null || prototype === Object.getPrototypeOf({});
}

function genDateWithAddedSeconds(dateStr: string, seconds: number): Date {
    const date = new Date(dateStr);
    date.setSeconds(date.getSeconds() + seconds);
    return date;
}

function genStatsItem(assets: string[]): StatsSchemaItem {
    return { date: new Date().toISOString(), assets };
}

function stringifyStats(stats: StatsSchema): string {
    return JSON.stringify(stats, null, 2);
}

/**
 * Fetch Webpack's output asset files
 */
function webpackStatsToAssetList(stats: Stats): string[] {
    const assets =
        stats.toJson(
            {
                assets: true,
            },
            true,
        ).assets || [];
    return assets.map((asset: { name: string }) => {
        return asset.name;
    });
}

class CleanWebpackPlugin {
    private readonly dry: boolean;
    private readonly verbose: boolean;
    private readonly cleanStaleWebpackAssets: boolean;
    private readonly protectWebpackAssets: boolean;
    private readonly cleanAfterEveryBuildPatterns: string[];
    private readonly cleanOnceBeforeBuildPatterns: string[];
    private readonly dangerouslyAllowCleanPatternsOutsideProject: boolean;
    private readonly preserve?: {
        maxAge: number;
        filename: string;
        path: string;
    };
    private currentAssets: string[];
    private initialClean: boolean;
    private outputPath: string;

    constructor(options: Options = {}) {
        if (isPlainObject(options) === false) {
            throw new Error(`clean-webpack-plugin only accepts an options object. See:
            https://github.com/johnagan/clean-webpack-plugin#options-and-defaults-optional`);
        }

        // @ts-ignore
        if (options.allowExternal) {
            throw new Error(
                'clean-webpack-plugin: `allowExternal` option no longer supported. Use `dangerouslyAllowCleanPatternsOutsideProject`',
            );
        }

        if (
            options.dangerouslyAllowCleanPatternsOutsideProject === true &&
            options.dry !== true &&
            options.dry !== false
        ) {
            // eslint-disable-next-line no-console
            console.warn(
                'clean-webpack-plugin: dangerouslyAllowCleanPatternsOutsideProject requires dry: false to be explicitly set. Enabling dry mode',
            );
        }

        this.dangerouslyAllowCleanPatternsOutsideProject =
            options.dangerouslyAllowCleanPatternsOutsideProject === true ||
            false;

        this.dry =
            options.dry === true || options.dry === false
                ? options.dry
                : this.dangerouslyAllowCleanPatternsOutsideProject === true ||
                  false;

        this.verbose = this.dry === true || options.verbose === true || false;

        this.preserve = options.preserve
            ? {
                  maxAge: options.preserve.maxAge,
                  filename: options.preserve.filename ?? 'cwp-stats.json',
                  path: options.preserve.path ?? process.cwd(),
              }
            : undefined;

        this.cleanStaleWebpackAssets =
            options.cleanStaleWebpackAssets === true ||
            options.cleanStaleWebpackAssets === false
                ? options.cleanStaleWebpackAssets
                : true;

        this.protectWebpackAssets =
            options.protectWebpackAssets === true ||
            options.protectWebpackAssets === false
                ? options.protectWebpackAssets
                : true;

        this.cleanAfterEveryBuildPatterns = Array.isArray(
            options.cleanAfterEveryBuildPatterns,
        )
            ? options.cleanAfterEveryBuildPatterns
            : [];

        this.cleanOnceBeforeBuildPatterns = Array.isArray(
            options.cleanOnceBeforeBuildPatterns,
        )
            ? options.cleanOnceBeforeBuildPatterns
            : ['**/*'];

        /**
         * Store webpack build assets
         */
        this.currentAssets = [];

        /**
         * Only used with cleanOnceBeforeBuildPatterns
         */
        this.initialClean = false;

        this.outputPath = '';

        this.apply = this.apply.bind(this);
        this.handleInitial = this.handleInitial.bind(this);
        this.handleDone = this.handleDone.bind(this);
        this.removeFiles = this.removeFiles.bind(this);
    }

    apply(compiler: Compiler) {
        if (!compiler.options.output || !compiler.options.output.path) {
            // eslint-disable-next-line no-console
            console.warn(
                'clean-webpack-plugin: options.output.path not defined. Plugin disabled...',
            );

            return;
        }

        this.outputPath = compiler.options.output.path;

        /**
         * webpack 4+ comes with a new plugin system.
         *
         * Check for hooks in-order to support old plugin system
         */
        const hooks = compiler.hooks;

        if (this.cleanOnceBeforeBuildPatterns.length !== 0) {
            if (hooks) {
                hooks.emit.tap('clean-webpack-plugin', (compilation) => {
                    this.handleInitial(compilation);
                });
            } else {
                compiler.plugin('emit', (compilation, callback) => {
                    try {
                        this.handleInitial(compilation);

                        callback();
                    } catch (error) {
                        callback(error);
                    }
                });
            }
        }

        if (hooks) {
            hooks.done.tap('clean-webpack-plugin', (stats) => {
                this.handleDone(stats);
            });
        } else {
            compiler.plugin('done', (stats) => {
                this.handleDone(stats);
            });
        }
    }

    /**
     * Initially remove files from output directory prior to build.
     *
     * Only happens once.
     *
     * Warning: It is recommended to initially clean your build directory outside of webpack to minimize unexpected behavior.
     */
    handleInitial(compilation: Compilation) {
        if (this.initialClean) {
            return;
        }

        /**
         * Do not remove files if there are compilation errors
         *
         * Handle logging inside this.handleDone
         */
        const stats = compilation.getStats();
        if (stats.hasErrors()) {
            return;
        }

        this.initialClean = true;

        let assetList: string[] = [];

        if (this.preserve?.maxAge) {
            assetList = webpackStatsToAssetList(stats);
            const fullPath = path.join(
                this.preserve.path,
                this.preserve.filename,
            );
            const currentDate = new Date();

            if (fs.existsSync(fullPath)) {
                const cwpStats: StatsSchema = require(fullPath);
                if (cwpStats && cwpStats.data) {
                    const currentAssets = assetList.slice();
                    const filtered = cwpStats.data.filter((item) => {
                        const builtDate = genDateWithAddedSeconds(
                            item.date,
                            this.preserve!.maxAge,
                        );
                        if (builtDate > currentDate) {
                            assetList.push(...item.assets);
                            return true;
                        }
                        return false;
                    });
                    filtered.unshift(genStatsItem(currentAssets));
                    fs.writeFileSync(
                        fullPath,
                        stringifyStats({ data: filtered }),
                    );
                }
            } else if (assetList.length > 0) {
                fs.writeFileSync(
                    fullPath,
                    stringifyStats({ data: [genStatsItem(assetList)] }),
                );
            }
        }
        this.removeFiles(this.cleanOnceBeforeBuildPatterns, assetList.sort());
    }

    handleDone(stats: Stats) {
        /**
         * Do nothing if there is a webpack error
         */
        if (stats.hasErrors()) {
            if (this.verbose) {
                // eslint-disable-next-line no-console
                console.warn(
                    'clean-webpack-plugin: pausing due to webpack errors',
                );
            }

            return;
        }

        const assetList = webpackStatsToAssetList(stats);

        /**
         * Get all files that were in the previous build but not the current
         *
         * (relies on del's cwd: outputPath option)
         */
        const staleFiles = this.currentAssets.filter((previousAsset) => {
            const assetCurrent = assetList.includes(previousAsset) === false;

            return assetCurrent;
        });

        /**
         * Save assets for next compilation
         */
        this.currentAssets = assetList.sort();

        const removePatterns = [];

        /**
         * Remove unused webpack assets
         */
        if (this.cleanStaleWebpackAssets === true && staleFiles.length !== 0) {
            removePatterns.push(...staleFiles);
        }

        /**
         * Remove cleanAfterEveryBuildPatterns
         */
        if (this.cleanAfterEveryBuildPatterns.length !== 0) {
            removePatterns.push(...this.cleanAfterEveryBuildPatterns);
        }

        if (removePatterns.length !== 0) {
            this.removeFiles(removePatterns, this.currentAssets);
        }
    }

    removeFiles(patterns: string[], ignore: string[] = []) {
        try {
            const finalIgnore = this.preserve
                ? [this.preserve.filename].concat(ignore)
                : ignore;

            const deleted = delSync(patterns, {
                force: this.dangerouslyAllowCleanPatternsOutsideProject,
                // Change context to build directory
                cwd: this.outputPath,
                dryRun: this.dry,
                dot: true,
                ignore: this.protectWebpackAssets ? finalIgnore : [],
            });

            /**
             * Log if verbose is enabled
             */
            if (this.verbose) {
                deleted.forEach((file) => {
                    const filename = path.relative(process.cwd(), file);

                    const message = this.dry ? 'dry' : 'removed';

                    /**
                     * Use console.warn over .log
                     * https://github.com/webpack/webpack/issues/1904
                     * https://github.com/johnagan/clean-webpack-plugin/issues/11
                     */
                    // eslint-disable-next-line no-console
                    console.warn(
                        `clean-webpack-plugin: ${message} ${filename}`,
                    );
                });
            }
        } catch (error) {
            const needsForce = /Cannot delete files\/folders outside the current working directory\./.test(
                error.message,
            );

            if (needsForce) {
                const message =
                    'clean-webpack-plugin: Cannot delete files/folders outside the current working directory. Can be overridden with the `dangerouslyAllowCleanPatternsOutsideProject` option.';

                throw new Error(message);
            }

            throw error;
        }
    }
}

export { CleanWebpackPlugin };
