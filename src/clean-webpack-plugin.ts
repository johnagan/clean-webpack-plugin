import { Compiler, Stats } from 'webpack';
import path from 'path';
import del from 'del';

interface Options {
    /**
     * Simulate the removal of files
     */
    dry: boolean;

    /**
     * console.warn removed files
     */
    verbose: boolean;

    /**
     * File patterns to files after webpack has been successfully ran
     *
     * use !negative patterns to exclude files
     *
     * See https://github.com/sindresorhus/del#patterns
     */
    customPatterns: string[];

    /**
     * Remove files once prior to compilation
     *
     * use !negative patterns to exclude files
     *
     * See https://github.com/sindresorhus/del#patterns
     */
    initialPatterns: string[];

    /**
     * Allow clean patterns outside of process.cwd()
     */
    dangerouslyAllowCleanPatternsOutsideProject: boolean;
}

class CleanWebpackPlugin {
    private readonly dry: boolean;
    private readonly verbose: boolean;
    private readonly customPatterns: string[];
    private readonly initialPatterns: string[];
    private readonly dangerouslyAllowCleanPatternsOutsideProject: boolean;
    private currentAssets: string[];
    private initialClean: boolean;
    private outputPath: string;

    constructor(options: Partial<Options> = {}) {
        if (typeof options !== 'object' || Array.isArray(options) === true) {
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

        this.customPatterns = Array.isArray(options.customPatterns)
            ? options.customPatterns
            : [];

        this.initialPatterns = Array.isArray(options.initialPatterns)
            ? options.initialPatterns
            : ['**'];

        /**
         * Store webpack build assets
         */
        this.currentAssets = [];

        /**
         * Only used with initialPatterns
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

        if (this.initialPatterns.length !== 0) {
            if (hooks) {
                hooks.compile.tap('clean-webpack-plugin', () => {
                    this.handleInitial();
                });
            } else {
                compiler.plugin('compile', () => {
                    this.handleInitial();
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
    handleInitial() {
        if (this.initialClean) {
            return;
        }

        this.initialClean = true;

        this.removeFiles([...this.initialPatterns, ...this.customPatterns]);
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
        const assets = stats.toJson().assets.map((asset: { name: string }) => {
            return asset.name;
        });

        /**
         * Get all files that were in the previous build but not the current
         *
         * (relies on del's cwd: outputPath option)
         */
        const staleFiles = this.currentAssets.filter((previousAsset) => {
            const assetCurrent = assets.includes(previousAsset) === false;

            return assetCurrent;
        });

        /**
         * Save assets for next compilation
         */
        this.currentAssets = assets.sort();

        /**
         * Do nothing if there aren't any files to delete and customPatterns is not defined
         */
        if (staleFiles.length === 0 && this.customPatterns.length === 0) {
            return;
        }

        /**
         * Merge customPatters with stale files.
         */
        this.removeFiles([...staleFiles, ...this.customPatterns]);
    }

    removeFiles(patterns: string[]) {
        try {
            const deleted = del.sync(patterns, {
                force: this.dangerouslyAllowCleanPatternsOutsideProject,
                // Change context to build directory
                cwd: this.outputPath,
                dryRun: this.dry,
                dot: true,
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

export default CleanWebpackPlugin;
