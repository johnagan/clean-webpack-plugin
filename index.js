'use strict'

const
  fs = require('fs'),
  os = require('os'),
  path = require('path'),
  rimraf = require('rimraf')


class CleanWebPackPlugin {

  /**
   * Plugin Constructor
   * 
   * @param {Array|String} paths - A single path string or array of paths
   * @param {Object} options - The plugin options to use when cleaning
   */
  constructor(paths, options) {
    this.paths = paths

    // backwards compatibility
    if (typeof options === 'string')
      options = { root: options }

    // set class options
    Object.assign(this, {}, options)

    // allows for a single string entry
    if (!Array.isArray(this.paths))
      this.paths = [this.paths]

    // initialize default options
    this.dry = this.dry || false
    this.isWin = os.platform() === 'win32'
    this.allowExternal = this.allowExternal || false
    this.root = this.root || path.dirname(module.parent.filename)
    this.verbose = this.verbose || process.env.NODE_ENV !== 'test'
  }


  apply(compiler) {
    if (compiler === undefined || !this.watch)
      return this.clean()
    else
      return compiler.plugin("compile", params => this.clean())
  }


  clean() {

    let
      logs = [],
      dirName = __dirname,
      workingDir = process.cwd(),
      projectRootDir = path.resolve(this.root),
      webpackDir = path.dirname(module.parent.filename)

    // log helper
    let log = (path, msg) => {
      logs.push({ path: path, output: msg })
      if (this.verbose) console.warn(`clean-webpack-plugin: ${path} ${msg}`)
      return logs
    }

    // exit if no paths passed in
    if (this.paths === void 0)
      return log(this.paths, 'nothing to clean')

    // require absolute root
    if (!isAbsolute(this.root))
      return log(this.root, `project root must be an absolute path. Skipping all...`)

    // adjust casing for Windows
    if (os.platform() === 'win32') {
      dirName = upperCaseWindowsRoot(dirName)
      webpackDir = upperCaseWindowsRoot(webpackDir)
      workingDir = upperCaseWindowsRoot(workingDir)
      projectRootDir = upperCaseWindowsRoot(projectRootDir)
    }

    // preform an rm -rf on each path
    this.paths.forEach(pathToDelete => {

      let excludedChildren = []
      let childrenAfterExcluding = []
      pathToDelete = path.resolve(this.root, pathToDelete)

      // adjust casing for Windows
      if (os.platform() === 'win32')
        pathToDelete = upperCaseWindowsRoot(pathToDelete)

      // disallow deletion any directories outside of root path.
      if (pathToDelete.indexOf(projectRootDir) < 0 && !this.allowExternal)
        return log(pathToDelete, 'must be inside the project root')

      // skip the project root
      if (pathToDelete === projectRootDir)
        return log(pathToDelete, 'is equal to project root')

      // skip the webpack root
      if (pathToDelete === webpackDir)
        return log(pathToDelete, 'would delete webpack')

      // skip the working directorty
      if (pathToDelete === dirName || pathToDelete === workingDir)
        return log(pathToDelete, 'is working directory')

      // skip excluded children
      if (this.exclude && this.exclude.length) {
        // map a list of path names
        let map = file => {
          let fullPath = path.join(pathToDelete, file)
          if (os.platform() === 'win32') fullPath = upperCaseWindowsRoot(fullPath)
          return fullPath
        }

        // filter a list excluded paths
        let filter = file => {
          let exclude = this.exclude.indexOf(file) !== -1
          if (exclude) excludedChildren.push(file)
          return exclude
        }

        try {
          let pathStat = fs.statSync(pathToDelete)
          if (pathStat.isDirectory())
            childrenAfterExcluding = fs.readdirSync(pathToDelete).filter(filter).map(map)

          // look for current dir
          if (this.exclude.indexOf('.') !== -1)
            excludedChildren.push('.')
        } catch (e) {
          childrenAfterExcluding = []
        }
      }


      // perform the delete unless it's a dry run
      if (this.dry !== true) {
        if (this.exclude && excludedChildren.length)
          childrenAfterExcluding.forEach(rimraf.sync)
        else
          rimraf.sync(pathToDelete)
      }

      // summary
      let summaryResult = 'removed'
      if (excludedChildren.length)
        summaryResult = `removed with exclusions (${excludedChildren.length})`

      return log(pathToDelete, summaryResult)
    })

    return logs
  }

}


/*--------------------------------------------------------*/

// added node .10
// http://stackoverflow.com/questions/21698906/how-to-check-if-a-path-is-absolute-or-relative/30714706#30714706
function isAbsolute(dir) {
  return path.normalize(dir + path.sep) === path.normalize(path.resolve(dir) + path.sep)
}

function upperCaseWindowsRoot(dir) {
  var splitPath = dir.split(path.sep)
  splitPath[0] = splitPath[0].toUpperCase()
  return splitPath.join(path.sep)
}



module.exports = CleanWebPackPlugin