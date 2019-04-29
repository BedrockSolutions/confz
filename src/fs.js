const { F_OK, R_OK, W_OK } = require('fs').constants
const {
  access,
  readdir,
  readFile: readFileAsync,
  stat,
} = require('fs').promises
const { endsWith, flatten } = require('lodash/fp')
const { dirname, extname, resolve } = require('path')
const { VError } = require('verror')

const ERROR_NAME = 'FileSystem'
const FILE_ENCODING = 'utf8'

const resolvePaths = async (
  paths,
  { doesFileExist = true, isWritable = false } = {}
) => {
  let path

  try {
    path = resolve(...paths)

    if (!doesFileExist) {
      path = dirname(path)
    }

    await access(path, isWritable ? F_OK | R_OK | W_OK : F_OK | R_OK)
  } catch (cause) {
    throw new VError(
      {
        cause,
        name: ERROR_NAME,
        info: {
          path,
          paths,
        },
      },
      `Error resolving paths ${paths.join(', ')}`
    )
  }

  return path
}

const getDirectoryPath = async path => {
  try {
    return (await stat(resolve(path))).isDirectory() ? path : dirname(path)
  } catch (cause) {
    throw new VError(
      {
        cause,
        name: ERROR_NAME,
        info: {
          path,
        },
      },
      `Error getting directory for path ${path}`
    )
  }
}

const readFile = async path => {
  try {
    return readFileAsync(resolve(path), FILE_ENCODING)
  } catch (cause) {
    throw new VError(
      {
        cause,
        name: ERROR_NAME,
        info: {
          path,
        },
      },
      `Error reading file ${path}`
    )
  }
}

const getFilesForPath = async (path, { allowedExtensions = [] } = {}) => {
  try {
    const files = !(await stat(path)).isDirectory()
      ? [path]
      : await getFilesForDir(path)

    return allowedExtensions.length
      ? files.filter(f => allowedExtensions.some(ex => endsWith(ex, f)))
      : files
  } catch (cause) {
    throw new VError(
      {
        cause,
        name: ERROR_NAME,
        info: {
          path,
        },
      },
      `Error getting files for ${path}`
    )
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
