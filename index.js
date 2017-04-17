'use strict'

const
  fs = require('fs'),
  path = require('path'),
  glob = require('glob')


const DEFAULTS = {
  dry: false,
  allowExternal: false,
  verbose: !process.env.LOADED_MOCHA_OPTS,
  root: path.dirname(module.parent.filename)
}


class CleanWebPackPlugin {

  /**
   * Plugin Constructor
   * 
   * @param {Array|String} paths - A single path string or array of paths
   * @param {Object} options - The plugin options to use when cleaning
   */
  constructor(paths, options) {
    Object.assign(this, DEFAULTS, { paths }, options)

    // convert to an absolute root
    if (!path.isAbsolute(this.root))
      this.root = path.resolve(DEFAULTS.root, this.root)

    // legacy includes
    if (!this.pattern && this.paths)
      this.pattern = this.getPattern(this.paths) + '/**'

    // legacy excludes
    if (!this.ignore && this.exclude)
      this.ignore = '**/' + this.getPattern(this.exclude) + '/**'
  }


  /**
   * Get a relative path from a target path
   * 
   * @param {String} target - A path string
   * @returns {String} a relative path of the target from the root
   */
  getRelativePath(target) {
    // support for relative paths
    if (!path.isAbsolute(target))
      target = path.join(this.root, target)

    return path.relative(this.root, target)
  }


  /**
   * Get a glob pattern from a target path or array of paths
   * 
   * @param {Array|String} paths - A single path string or array of paths
   * @returns {String} a glob pattern based on the target
   */
  getPattern(target) {
    if (!Array.isArray(target)) target = [target]
    let paths = target.map(this.getRelativePath.bind(this)).join('|')
    return `+(${paths})`
  }


  /**
   * List file and directory matches
   * 
   * @returns {Object} The match results
   */
  getMatches() {
    // nothing to do
    if (!this.pattern) {
      this.log("No pattern provided")
      return []
    }

    return glob.sync(this.pattern, {
      ignore: this.ignore,
      cwd: this.root,
      mark: true
    })
  }


  /**
   * Cleans the paths provided
   * 
   * @returns {Object} The match results
   */
  clean() {
    let matches = this.getMatches()
    let files = matches.filter(m => !m.endsWith('/'))
    let folders = matches.filter(m => m.endsWith('/'))

    // delete files
    files.forEach(file => {
      this.log(`deleting file ${file}`)
      if (!this.dry) fs.unlinkSync(file)
    })

    // delete folders
    folders.forEach(folder => {
      this.log(`deleting folder ${folder}`)
      if (!this.dry) fs.rmdirSync(folder)
    })

    return matches
  }


  /**
   * WebPack's apply interface
   * 
   * @param {Object} compiler - The WebPack compiler
   */
  apply(compiler) {
    if (compiler === undefined || !this.watch)
      return this.clean()
    else
      return compiler.plugin("compile", params => this.clean())
  }


  /**
   * Log messages to console
   * 
   * @param {String} message - The message to log to the console
   */
  log(message) {
    if (this.verbose) console.warn(`[clean-webpack-plugin]: ${message}`)
  }

}

module.exports = CleanWebPackPlugin