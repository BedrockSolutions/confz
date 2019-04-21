const { getDirectoryPath, readFile, resolvePath } = require('./fs')
const { log } = require('./logging')
const { validate } = require('./validation')

const GLOBAL_CONFIG_SCHEMA = {
  properties: {
    data: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
    dataSchema: {
      type: 'object',
    },
    defaultData: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
    resourceDir: { type: 'string' },
    templateDir: { type: 'string' },
  },
  required: ['templateDir', 'resourceDir'],
  anyOf: [{ required: ['defaultData'] }, { required: ['data'] }],
  additionalProperties: false,
}

const getGlobalConfig = async ({ config = './confz.yaml' }) => {
  // Steps:
  // 1. Read file with fs.readFile
  // 2. Parse file with js-yaml
  // 3. Merge global config with confz default config and command args overrides
  // default config -> confz.yaml -> command args = final global config
  // 4. Validate global config against confz JSON schema

  const configFilePath = await resolvePath(config)
  log.info(`Global Config: configuration file located in ${configFilePath}`)

  const confzHomeDir = await getDirectoryPath(configFilePath)
  log.info(`Global Config: confz home set to ${confzHomeDir}`)

  const data = {
    templateDir: '/foo/bar',
    resourceDir: '/a/b/c',
    data: ['/hello/world'],
    defaultData: ['/z/y/x'],
  }

  validate({
    data,
    schema: GLOBAL_CONFIG_SCHEMA,
    schemaName: 'global configuration',
  })

  return data
}

module.exports = { getGlobalConfig }
