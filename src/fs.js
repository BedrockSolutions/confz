const { F_OK, R_OK, W_OK } = require('fs').constants
const {
  access,
  chmod,
  chown,
  readdir,
  readFile: readFileAsync,
  stat,
  writeFile: writeFileAsync,
} = require('fs').promises
const { flatten } = require('lodash/fp')
const { dirname, extname, resolve } = require('path')
const {gid, uid} = require('userid')
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

    await access(
      doesFileExist ? path : dirname(path),
      F_OK | R_OK | (isWritable ? W_OK : 0)
    )
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

const readFile = async (path, { ignoreMissingFile = false } = {}) => {
  try {
    return await readFileAsync(resolve(path), FILE_ENCODING)
  } catch (cause) {
    if (ignoreMissingFile && cause.code === 'ENOENT') {
      return ''
    }

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

const writeFile = async (path, data, {mode, owner, group} = {}) => {
  try {
    const resolvedPath = resolve(path)
    await writeFileAsync(resolvedPath, data, {encoding: FILE_ENCODING, mode})

    if (owner && group) {
      await chown(resolvedPath, uid(owner), gid(group))
    }
  } catch (cause) {
    throw new VError(
      {
        cause,
        name: ERROR_NAME,
        info: {
          path,
        },
      },
      `Error writing file ${path}`
    )
  }
}

const getFilesForPath = async (path, { allowedExtensions = [] } = {}) => {
  try {
    const files = !(await stat(path)).isDirectory()
      ? [path]
      : await getFilesForDir(path)

    return allowedExtensions.length
      ? files.filter(f => allowedExtensions.some(ex => extname(f) === `.${ex}`))
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

module.exports = {
  getDirectoryPath,
  getFilesForPath,
  readFile,
  resolvePaths,
  writeFile,
}
