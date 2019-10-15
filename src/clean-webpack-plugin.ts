import path from 'path';
import del from 'del';
import { Compiler, Stats, compilation as compilationType } from 'webpack';

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
}

// Copied from https://github.com/sindresorhus/is-plain-obj/blob/97480673cf12145b32ec2ee924980d66572e8a86/index.js
function isPlainObject(value: unknown): boolean {
    if (Object.prototype.toString.call(value) !== '[object Object]') {
        return false;
    }

    const prototype = Object.getPrototypeOf(value);
    return prototype === null || prototype === Object.getPrototypeOf({});
}

class CleanWebpackPlugin {
    private readonly dry: boolean;
    private readonly verbose: boolean;
    private readonly cleanStaleWebpackAssets: boolean;
    private readonly protectWebpackAssets: boolean;
    private readonly cleanAfterEveryBuildPatterns: string[];
    private readonly cleanOnceBeforeBuildPatterns: string[];
    private readonly dangerouslyAllowCleanPatternsOutsideProject: boolean;
    private currentAssets: string[];
    private initialClean: boolean;
    private outputPath: string;
    private useHooks: boolean | null;

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
        this.useHooks = null;

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
        this.useHooks = hooks !== undefined;

        if (this.cleanOnceBeforeBuildPatterns.length !== 0) {
            if (this.useHooks === true) {
                hooks.afterCompile.tapPromise(
                    'clean-webpack-plugin',
                    this.handleInitial,
                );
            } else {
                compiler.plugin(
                    'after-compile',
                    async (compilation, callback) => {
                        try {
                            await this.handleInitial(compilation);

                            callback();
                        } catch (error) {
                            callback(error);
                        }
                    },
                );
            }
        }

        if (this.useHooks === true) {
            hooks.done.tapPromise('clean-webpack-plugin', async (stats) => {
                await this.handleDone(stats);
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
    async handleInitial(compilation: Compilation) {
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

        await this.removeFiles({
            patterns: this.cleanOnceBeforeBuildPatterns,
            sync: false,
        });
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

        /**
         * Fetch Webpack's output asset files
         */
        const assets =
            stats.toJson(
                {
                    assets: true,
                },
                true,
            ).assets || [];
        const assetList = assets.map((asset: { name: string }) => {
            return asset.name;
        });

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
            // eslint-disable-next-line consistent-return
            return this.removeFiles({
                patterns: removePatterns,
                sync: this.useHooks === false,
            });
        }
    }

    // eslint-disable-next-line class-methods-use-this
    handleDelError(error: Error) {
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

    logResult(deleted: string[]): void {
        if (this.verbose === false) {
            return;
        }

        /**
         * Log if verbose is enabled
         */
        deleted.forEach((file) => {
            const filename = path.relative(process.cwd(), file);

            const message = this.dry ? 'dry' : 'removed';

            /**
             * Use console.warn over .log
             * https://github.com/webpack/webpack/issues/1904
             * https://github.com/johnagan/clean-webpack-plugin/issues/11
             */
            // eslint-disable-next-line no-console
            console.warn(`clean-webpack-plugin: ${message} ${filename}`);
        });
    }

    removeFiles({ patterns, sync }: { patterns: string[]; sync: boolean }) {
        const delOptions = {
            force: this.dangerouslyAllowCleanPatternsOutsideProject,
            // Change context to build directory
            cwd: this.outputPath,
            dryRun: this.dry,
            dot: true,
            ignore: this.protectWebpackAssets ? this.currentAssets : [],
        };

        // webpack v3 done plugin hook cannot be async. Use sync version until webpack v3 support is dropped.
        if (sync === true) {
            try {
                const deleted = del.sync(patterns, delOptions);
                this.logResult(deleted);
            } catch (error) {
                this.handleDelError(error);
            }
        }

        return (
            del(patterns, delOptions)
                // eslint-disable-next-line promise/always-return
                .then((deleted: string[]): void => {
                    this.logResult(deleted);
                })
                .catch((error) => {
                    this.handleDelError(error);
                })
        );
    }
}

export { CleanWebpackPlugin };
