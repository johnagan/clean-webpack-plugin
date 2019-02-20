import { Compiler } from "webpack";
import ora from "ora";
export declare class CleanWebpackPlugin {
    /** The results of a clean */
    results: CleanWebpackPluginResults;
    /** The configuration options for the plugin */
    options: CleanWebpackPluginOptions;
    /** The CLI spinner */
    spinner: ora.Ora;
    /** The paths to clean */
    paths: string[];
    /**
     * Creates a new instance of Clean Webpack Plugin
     * @param paths the path(s) to clean
     * @param options additional plugin options
     */
    constructor(path: CleanWebpackPluginPath, options?: CleanWebpackPluginOptions);
    /**
     * Get the additional plugin options
     * @param options additional options
     */
    getOptions(options?: CleanWebpackPluginOptions): {
        root?: string;
        cwd?: string;
        verbose?: boolean;
        dry?: boolean;
        watch?: boolean;
        exclude?: string | string[];
        allowExternal?: boolean;
        spinner?: boolean;
    };
    /**
     * Get the absolute paths of a path set
     * @param path a path string or string array to convert
     */
    getPaths(path: CleanWebpackPluginPath): string[];
    /**
     * Apply plugin to WebPack
     * @param compiler the webpack compiler
     */
    apply(compiler: Compiler): void;
    /**
     * Clean based on configuration
     */
    clean(): void;
    /**
     * Log message to console
     * @param message the message to log
     */
    log(message: string): void;
    /**
     * Delete a path
     * @param path the path to delete
     */
    delete(path: string): void;
    /**
     * Skip a path
     * @param path the path to skip
     */
    skip(path: string): void;
}
