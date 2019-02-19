declare type CleanWebpackPluginPath = string | string[];

declare type CleanWebpackPluginAction = "deleted" | "skipped" | "errors";

declare interface CleanWebpackPluginOptions {
  /**
   * The path to your webpack root folder (paths appended to this)
   * @deprecated use cwd
   */
  root?: string;

  /**
   * The current working directory
   * @default dirname(module.parent.filename)
   */
  cwd?: string;

  /**
   * Write logs to console.
   * @default false
   */
  verbose?: boolean;

  /**
   * Use boolean "true" to test/emulate delete. (will not remove files).
   * @default false
   */
  dry?: boolean;

  /**
   * If true, remove files on recompile.
   * @default false
   **/
  watch?: boolean;

  /**
   * Instead of removing whole path recursively,
   * remove all path's content with exclusion of provided immediate children.
   * Good for not removing shared files from build directories.
   * @default []
   */
  exclude?: CleanWebpackPluginPath;

  /**
   * allow the plugin to clean folders outside of the webpack root.
   * @default false
   */
  allowExternal?: boolean;

  /**
   * enable the cli spinner while cleaning
   * @default true
   */
  spinner?: boolean;
}
