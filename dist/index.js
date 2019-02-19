"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const fs_extra_1 = require("fs-extra");
const glob_1 = require("glob");
const ora_1 = __importDefault(require("ora"));
const PLUGIN_NAME = "clean-webpack-plugin";
class CleanWebpackPlugin {
    /**
     * Creates a new instance of Clean Webpack Plugin
     * @param paths the path(s) to clean
     * @param options additional plugin options
     */
    constructor(path, options) {
        // set initial options
        this.options = this.getOptions(options);
        // update paths
        this.paths = this.getPaths(path);
        // init the results
        this.results = { deleted: [], skipped: [], errors: [] };
    }
    /**
     * Get the additional plugin options
     * @param options additional options
     */
    getOptions(options) {
        // default option values
        const defaults = {
            cwd: path_1.dirname(module.parent.filename),
            allowExternal: false,
            verbose: false,
            spinner: true,
            watch: false,
            exclude: [],
            dry: false
        };
        // assign to instance
        return Object.assign({}, defaults, options);
    }
    /**
     * Get the absolute paths of a path set
     * @param path a path string or string array to convert
     */
    getPaths(path) {
        // allow for path to be a string or string array
        const paths = Array.isArray(path) ? path : [path];
        // resolve current working dir
        const cwd = path_1.resolve(this.options.cwd);
        return paths.reduce((matches, curr) => {
            // convert relative paths to absolute paths
            const absPath = path_1.resolve(cwd, curr);
            // concat glob results
            return matches.concat(glob_1.sync(absPath));
        }, []);
    }
    /**
     * Apply plugin to WebPack
     * @param compiler the webpack compiler
     */
    apply(compiler) {
        const { hooks } = compiler;
        const { watch } = this.options;
        const clean = this.clean.bind(this);
        if (hooks) {
            if (watch)
                hooks.compile.tap(PLUGIN_NAME, clean);
            else
                hooks.emit.tapAsync(PLUGIN_NAME, clean);
        }
        else {
            if (watch)
                compiler.plugin("compile", clean);
            else
                compiler.plugin("emit", clean);
        }
    }
    /**
     * Clean based on configuration
     */
    clean() {
        const { exclude, spinner, allowExternal } = this.options;
        // start the cli spinner
        if (spinner)
            this.spinner = ora_1.default().start();
        this.log(`Preparing to clean ${this.paths.length} paths`);
        // get absolute paths to exclude
        const excludes = this.getPaths(exclude);
        this.log(`found ${excludes.length} paths to exclude`);
        this.paths.forEach(path => {
            try {
                // exclude paths that are not under CWD unless allowExternal
                const isChild = path.startsWith(this.options.cwd);
                if (!allowExternal && !isChild)
                    return this.skip(path);
                // check if excluded, if not then delete
                const excluded = excludes.includes(path);
                return excluded ? this.skip(path) : this.delete(path);
            }
            catch (err) {
                this.log(err);
                this.results.errors.push(path);
            }
        });
        // stop the cli spinner
        if (spinner)
            this.spinner.stop();
        this.log(`completed clean`);
    }
    /**
     * Log message to console
     * @param message the message to log
     */
    log(message) {
        const { verbose, spinner } = this.options;
        // set spinner text (if enabled)
        if (spinner)
            this.spinner.text = message;
        // log to console when verbose
        if (verbose)
            console.info(message);
    }
    /**
     * Delete a path
     * @param path the path to delete
     */
    delete(path) {
        const { dry } = this.options;
        const isDir = fs_extra_1.lstatSync(path).isDirectory();
        if (dry) {
            this.log(`[dry run]: deleting ${path}`);
        }
        else {
            this.log(`deleting ${path}`);
            // delete the file or directory
            isDir ? fs_extra_1.emptyDirSync(path) : fs_extra_1.unlinkSync(path);
        }
        // log result
        this.results.deleted.push(path);
    }
    /**
     * Skip a path
     * @param path the path to skip
     */
    skip(path) {
        this.log(`skipping ${path}`);
        // add to results
        this.results.skipped.push(path);
    }
}
exports.CleanWebpackPlugin = CleanWebpackPlugin;
