const { F_OK, R_OK, W_OK } = require('fs').constants
const {
  access,
  readdir,
  readFile: readFileAsync,
  stat,
} = require('fs').promises
const { flatten } = require('lodash/fp')
const { dirname, resolve } = require('path')

const { ConfzError } = require('./ConfzError')
const { log } = require('./logging')

const FILE_ENCODING = 'utf8'

class FileSystemError extends ConfzError {}

const resolvePaths = async (
  paths,
  { doesFileExist = true, isWritable = false, description = '' } = {}
) => {
  let resolvedPath = resolve(...paths)
  try {
    if (!doesFileExist) {
      console.log('before')
      resolvedPath = dirname(resolvedPath)
      console.log('after')
    }

    await access(resolvedPath, isWritable ? F_OK | R_OK | W_OK : F_OK | R_OK)
    return resolvedPath
  } catch (err) {
    log.error(
      `File System: error accessing ${description &&
        description + ' '}${resolvedPath}: ${err.message}`
    )
    throw new FileSystemError(`Error accessing ${resolvedPath}: ${err.message}`)
  }
}

const getDirectoryPath = async path => {
  const resolvedPath = resolve(path)

  try {
    const stats = await stat(resolvedPath)

    return stats.isDirectory() ? resolvedPath : dirname(resolvedPath)
  } catch (err) {
    log.error(
      `File System: error getting directory for ${resolvedPath}: ${err.message}`
    )
    throw new FileSystemError(
      `Error getting directory for ${resolvedPath}: ${err.message}`
    )
  }
}

const readFile = async path => {
  const resolvedPath = resolve(path)

  try {
    return readFileAsync(resolvedPath, FILE_ENCODING)
  } catch (err) {
    log.error(`File System: error reading file ${resolvedPath}: ${err.message}`)
    throw new FileSystemError(
      `Error reading file ${resolvedPath}: ${err.message}`
    )
  }
}

const getFilesForPath = async path => {
  try {
    if (!(await stat(path)).isDirectory()) {
      return [path]
    }

    return getFilesForDir(path)
  } catch (err) {
    log.error(`File System: error traversing ${path}: ${err.message}`)
    throw new FileSystemError(`Error traversing ${path}: ${err.message}`)
  }
}

const getFilesForDir = async dir => {
  const dirListing = await readdir(dir)

  const files = await Promise.map(dirListing, async file => {
    const resolvedPath = resolve(dir, file)
    return (await stat(resolvedPath)).isDirectory()
      ? getFilesForDir(resolvedPath)
      : resolvedPath
  })

  return flatten(files)
}

module.exports = { getDirectoryPath, getFilesForPath, readFile, resolvePaths }
