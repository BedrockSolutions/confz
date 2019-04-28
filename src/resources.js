const { VError } = require('verror')

const { getDirectoryPath, getFilesForPath, resolvePaths } = require('./fs')
const { verifyTemplatePath } = require('./templates')
const { validate } = require('./validation')
const { loadFile } = require('./yaml')

const ERROR_NAME = 'Resources'

const RESOURCE_SCHEMA = {
  properties: {
    src: {
      type: 'string',
      format: 'uri-reference',
    },
    dest: {
      type: 'string',
      format: 'uri-reference',
    },
    owner: {
      type: 'string',
      pattern: '^[a-z]+$',
    },
    mode: {
      type: 'string',
      pattern: '^[0124567]{4}$',
    },
    checkCmd: {
      type: 'string',
      format: 'uri-reference',
    },
    reloadCmd: {
      type: 'string',
      format: 'uri-reference',
    },
  },
  required: ['src', 'dest'],
  additionalProperties: false,
}

let resources

const initResources = async resourceDir => {
  let resourcePaths
  try {
    resourcePaths = await getFilesForPath(resourceDir)
  } catch (cause) {
    throw new VError(
      {
        cause,
        name: ERROR_NAME,
        info: {
          resourceDir,
        },
      },
      `Error initializing resources at ${resourceDir}`
    )
  }

  resources = await Promise.reduce(
    resourcePaths,
    async (memo, resourcePath) => {
      try {
        const resource = await loadFile(resourcePath)

        validate(resource, RESOURCE_SCHEMA, resourcePath)
        verifyTemplatePath(resource.src)

        const resourceDir = await resolvePaths([resource.dest], {
          doesFileExist: false,
          isWritable: true,
        })

        memo[resourcePath] = {
          ...resource,
          dest: resourceDir,
        }

        return memo
      } catch (cause) {
        throw new VError(
          {
            cause,
            name: ERROR_NAME,
            info: {
              resourceDir,
              resourcePath,
            },
          },
          `Error initializing resources at ${resourceDir}`
        )
      }
    },
    {}
  )
}

// const processResources = async (values) =>

module.exports = { initResources }
