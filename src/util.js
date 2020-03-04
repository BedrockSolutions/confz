const nodeFileEval = require('node-file-eval')
const { extname } = require('path')

const { readFile } = require('./fs')
const { log } = require('./logging')
const { loadFile } = require('./yaml')

const displayMultilineText = text =>
  text.split(/\r?\n/).forEach(line => log.info(line))

const loadFileAtPath = async path => {
  const ext = extname(path)

  switch (ext) {
    case '.js':
      return await nodeFileEval(path)

    case '.json':
      return JSON.parse(await readFile(path))

    case '.yml':
    case '.yaml':
      return loadFile(path)
  }
}

module.exports = { displayMultilineText, loadFileAtPath }
