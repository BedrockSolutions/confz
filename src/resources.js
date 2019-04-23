const { getDirectoryPath, getFilesForPath, resolvePaths } = require('./fs')
const { verifyTemplatePath } = require('./templates')
const { validate } = require('./validation')
const { loadFile } = require('./yaml')

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
  const resourcePaths = await getFilesForPath(resourceDir)

  resources = await Promise.reduce(
    resourcePaths,
    async (memo, path) => {
      const resource = await loadFile(path)
      console.log(resource)

      validate(resource, RESOURCE_SCHEMA, path)
      verifyTemplatePath(resource.src, {
        description: `resource ${path} source`,
      })

      const resourceDir = await resolvePaths([resource.dest], {
        description: `resource ${path} destination`,
        doesFileExist: false,
        isWritable: true,
      })

      memo[path] = {
        ...resource,
        dest: resourceDir,
      }

      return memo
    },
    {}
  )

  console.log(resources)
}

// const processResources = async (values) =>

module.exports = { initResources }
