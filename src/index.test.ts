import { CleanWebpackPlugin } from "./index";
import { join, resolve } from "path";

const testRoot = "test";
const cwd = join(__dirname, "..");

/*************************************************
 * Current Working Directory Tests
 *************************************************/

test("default root", () => {
  const cwp = new CleanWebpackPlugin(testRoot);
  expect(cwp.options.cwd).toBe(__dirname);
});

test("custom root", () => {
  const cwp = new CleanWebpackPlugin(testRoot, { cwd });
  expect(cwp.options.cwd).toBe(cwd);
});

/*************************************************
 * Path Tests
 *************************************************/

test("single path", () => {
  const cwp = new CleanWebpackPlugin(testRoot, { cwd });
  expect(cwp.paths.length).toBe(1);
  expect(cwp.paths[0]).toBe(resolve(testRoot));
});

test("multiple paths", () => {
  const paths = [join(testRoot, "delete-dir"), join(testRoot, "delete-file.keep")];
  const cwp = new CleanWebpackPlugin(paths, { cwd });

  const matches = cwp.paths.filter(p => p.match(/(dont-)?delete/g));
  expect(matches.length).toBe(2);
});

test("wildcard: files", () => {
  const paths = join(testRoot, "**", "*.*");
  const cwp = new CleanWebpackPlugin(paths, { cwd });

  const matches = cwp.paths.filter(p => p.match(/(dont-)?delete/g));
  expect(matches.length).toBe(2);
});

test("wildcard: greedy", () => {
  const paths = join(testRoot, "**");
  const cwp = new CleanWebpackPlugin(paths, { cwd });

  const matches = cwp.paths.filter(p => p.match(/(dont-)?delete/g));
  expect(matches.length).toBe(4);
});

/*************************************************
 * Clean Test
 *************************************************/

test("single dir deleted", () => {
  const paths = testRoot;
  const cwp = new CleanWebpackPlugin(paths, { cwd, dry: true });
  cwp.clean();

  const { deleted, skipped, errors } = cwp.results;
  expect(deleted.length).toBe(1);
  expect(skipped.length).toBe(0);
  expect(errors.length).toBe(0);
});

test("multiple dirs deleted", () => {
  const paths = [testRoot, join(testRoot, "delete-dir")];
  const cwp = new CleanWebpackPlugin(paths, { cwd, dry: true });
  cwp.clean();

  const { deleted, skipped, errors } = cwp.results;
  expect(deleted.length).toBe(2);
  expect(skipped.length).toBe(0);
  expect(errors.length).toBe(0);
});

test("glob path deleted", () => {
  const paths = join(testRoot, "**");
  const cwp = new CleanWebpackPlugin(paths, { cwd, dry: true });
  cwp.clean();

  const { deleted, skipped, errors } = cwp.results;
  expect(deleted.length).toBe(5);
  expect(skipped.length).toBe(0);
  expect(errors.length).toBe(0);
});

test("glob files deleted", () => {
  const paths = join(testRoot, "**", "*.*");
  const cwp = new CleanWebpackPlugin(paths, { cwd, dry: true });
  cwp.clean();

  const { deleted, skipped, errors } = cwp.results;
  expect(deleted.length).toBe(2);
  expect(skipped.length).toBe(0);
  expect(errors.length).toBe(0);
});

test("paths excluded", () => {
  const paths = join(testRoot, "**");
  const exclude = [join(testRoot, "dont-delete*"), join(testRoot, "dont-delete*.*")];
  const cwp = new CleanWebpackPlugin(paths, { cwd, exclude, dry: true });
  cwp.clean();

  const { deleted, skipped, errors } = cwp.results;
  expect(deleted.length).toBe(3);
  expect(skipped.length).toBe(2);
  expect(errors.length).toBe(0);
});

test("skip external paths", () => {
  const paths = join("..", "*");
  const cwd = join(__dirname, "..", "test");
  const cwp = new CleanWebpackPlugin(paths, { cwd, dry: true });
  cwp.clean();

  const { deleted, errors } = cwp.results;
  console.log(deleted);
  expect(deleted.length).toBe(1);
  expect(errors.length).toBe(0);
});

test("include external paths", () => {
  const paths = join("..", "*");
  const cwd = join(__dirname, "..", "test");
  const cwp = new CleanWebpackPlugin(paths, { cwd, allowExternal: true, dry: true });
  cwp.clean();

  const { deleted, errors } = cwp.results;
  expect(deleted.length).toBeGreaterThan(1);
  expect(errors.length).toBe(0);
});
