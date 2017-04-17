'use strict'

const
  path = require('path'),
  expect = require('chai').expect,
  Plugin = require('../index')

describe('plugin', () => {
  const TEST_PATH = 'test'
  const PROJECT_ROOT_PATH = 'project_root'
  const OUTSIDE_PROJECT_ROOT_PATH = 'outside_root'
  const TEST_ROOT = path.resolve(process.cwd(), TEST_PATH)

  let root = PROJECT_ROOT_PATH

  describe('paths', () => {
    it("shouldn't clean anything with no arguments", () => {
      let plugin = new Plugin()
      let matches = plugin.getMatches()
      expect(matches.length).to.equal(0)
    })

    it('should remove a direct path', () => {
      let plugin = new Plugin(['_one'], { root })
      let matches = plugin.getMatches()
      expect(matches.length).to.equal(7)
    })

    it('should remove a relative path', () => {
      let plugin = new Plugin(['./_one'], { root })
      let matches = plugin.getMatches()
      expect(matches.length).to.equal(7)
    })

    it('should remove an absolute path', () => {
      let absolutePath = path.resolve(TEST_ROOT, PROJECT_ROOT_PATH, '_one')
      let plugin = new Plugin([absolutePath], { root })
      let matches = plugin.getMatches()
      expect(matches.length).to.equal(7)
    })

    it('should remove a string path', () => {
      let plugin = new Plugin('_one', { root })
      let matches = plugin.getMatches()
      expect(matches.length).to.equal(7)
    })

    it('should remove multiple paths', () => {
      let plugin = new Plugin(['_one', '_two'], { root })
      let matches = plugin.getMatches()
      expect(matches.length).to.equal(10)
    })
  })

  describe('excludes', () => {
    it('should exclude one path', () => {
      let plugin = new Plugin(['_one'], { root, exclude: ['_sub_one'] })
      let matches = plugin.getMatches()
      expect(matches.length).to.equal(5)
    })

    it('should exclude multiple files', () => {
      let plugin = new Plugin(['_one'], { root, exclude: ['_sub_one', '_sub_two'] })
      let matches = plugin.getMatches()
      expect(matches.length).to.equal(3)
    })

    it('should ignore non-existing paths', () => {
      let plugin = new Plugin(['_one'], { root, exclude: ['fake'] })
      let matches = plugin.getMatches()
      expect(matches.length).to.equal(7)
    })

    it('should ignore paths from multiple directories', () => {
      let plugin = new Plugin(['_one', '_two'], { root, exclude: ['_sub_one'] })
      let matches = plugin.getMatches()
      expect(matches.length).to.equal(7)
    })
  })

  describe('root', () => {
    it('should remove a path outside of the cwd', () => {
      let root = path.resolve(TEST_ROOT, OUTSIDE_PROJECT_ROOT_PATH)
      let plugin = new Plugin(['_three'], { root })
      let matches = plugin.getMatches()
      expect(matches.length).to.equal(4)
    })

    it('should convert relative root path', () => {
      let plugin = new Plugin(['_one', '_two'], { root })
      let absolutePath = path.resolve(TEST_ROOT, PROJECT_ROOT_PATH)
      expect(plugin.root).to.equal(absolutePath)
    })

    it('should clean a relative root path', () => {
      let plugin = new Plugin(['_one'], { root })
      let matches = plugin.getMatches()
      expect(matches.length).to.equal(7)
    })

    it("shouldn't clean outside the project root", () => {
      let plugin = new Plugin(['_three'], { root })
      let matches = plugin.getMatches()
      expect(matches.length).to.equal(0)
    })

    it('should clean inside the project root', () => {
      let plugin = new Plugin(['_three'], { root: OUTSIDE_PROJECT_ROOT_PATH })
      let matches = plugin.getMatches()
      expect(matches.length).to.equal(4)
    })

    it("shouldn't clean if project root is the same as the path", () => {
      let plugin = new Plugin([PROJECT_ROOT_PATH], { root })
      let matches = plugin.getMatches()
      expect(matches.length).to.equal(0)
    })
  })

})