const { getDirectoryPath, resolvePaths } = require('./fs')
const { log } = require('./logging')
const { validate } = require('./validation')
const { loadFile } = require('./yaml')

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

const GLOBAL_CONFIG_DEFAULTS = {
  resourceDir: 'resources',
  templateDir: 'templates',
}

const getGlobalConfig = async ({ config = './confz.yaml' }) => {
  // Steps:
  // 1. Read file with fs.readFile
  // 2. Parse file with js-yaml
  // 3. Merge global config with confz default config and command args overrides
  // default config -> confz.yaml -> command args = final global config
  // 4. Validate global config against confz JSON schema

  const configFilePath = await resolvePaths([config])

  const homeDir = await getDirectoryPath(configFilePath)
  log.info(`Global Config: home directory set to ${homeDir}`)

  const prelimGlobalConfig = {
    ...GLOBAL_CONFIG_DEFAULTS,
    ...(await loadFile(config)),
  }
  log.info('Global Config: configuration file successfuly loaded')

  validate(prelimGlobalConfig, GLOBAL_CONFIG_SCHEMA, configFilePath)

  const globalConfig = {
    data: await Promise.all(
      prelimGlobalConfig.data.map(path => resolvePaths([homeDir, path]))
    ),
    dataSchema: prelimGlobalConfig.dataSchema,
    defaultData: await Promise.all(
      prelimGlobalConfig.defaultData.map(path => resolvePaths([homeDir, path]))
    ),
    homeDir,
    resourceDir: await resolvePaths([homeDir, prelimGlobalConfig.resourceDir]),
    templateDir: await resolvePaths([homeDir, prelimGlobalConfig.templateDir]),
  }

  log.info('Global Config: all paths in configuration successfully resolved')

  console.log(globalConfig)

  return globalConfig
}

module.exports = { getGlobalConfig }
