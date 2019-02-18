import { Compiler, Stats } from 'webpack';
import path from 'path';
import del from 'del';

interface Options {
    dryRun: boolean;
    verbose: boolean;
    customPatterns: string[];
    initialPatterns: string[];
}

class CleanWebpackPlugin {
    private readonly options: Options;
    private currentAssets: string[];
    private initialClean: boolean;
    private outputPath: string;

    constructor(options: Partial<Options> = {}) {
        this.options = {
            /**
             * Simulate the removal of files
             */
            dryRun: options.dryRun || false,

            /**
             * console.warn removed files
             */
            verbose: options.dryRun || options.verbose || false,

            /**
             * Custom pattern matching
             *
             * See https://github.com/sindresorhus/del#patterns
             */
            customPatterns: options.customPatterns || [],

            /**
             * Remove files once prior to compilation
             *
             * See https://github.com/sindresorhus/del#patterns
             */
            initialPatterns: options.initialPatterns || [],
        };

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

        if (this.options.initialPatterns.length !== 0) {
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
     * Warning: It is highly recommended to clean your build directory outside of webpack to minimize unexpected behavior.
     */
    handleInitial() {
        if (this.initialClean) {
            return;
        }

        this.initialClean = true;

        this.removeFiles([
            ...this.options.initialPatterns,
            ...this.options.customPatterns,
        ]);
    }

    handleDone(stats: Stats) {
        /**
         * Do nothing if there is a webpack error
         */
        if (stats.hasErrors()) {
            if (this.options.verbose) {
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
        if (
            staleFiles.length === 0 &&
            this.options.customPatterns.length === 0
        ) {
            return;
        }

        /**
         * Merge customPatters with stale files.
         */
        this.removeFiles([...staleFiles, ...this.options.customPatterns]);
    }

    removeFiles(patterns: string[]) {
        const deleted = del.sync(patterns, {
            // Change context to build directory
            cwd: this.outputPath,
            dryRun: this.options.dryRun,
            dot: true,
        });

        /**
         * Log if verbose is enabled
         */
        if (this.options.verbose) {
            deleted.forEach((file) => {
                const filename = path.relative(this.outputPath, file);

                const message = this.options.dryRun ? 'dryRun' : 'removed';

                /**
                 * Use console.warn over .log
                 * https://github.com/webpack/webpack/issues/1904
                 * https://github.com/johnagan/clean-webpack-plugin/issues/11
                 */
                // eslint-disable-next-line no-console
                console.warn(`clean-webpack-plugin: ${message} ${filename}`);
            });
        }
    }
}

export default CleanWebpackPlugin;
