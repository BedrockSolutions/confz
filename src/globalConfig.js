const { getDirectoryPath, resolvePaths } = require('./fs')
const { log } = require('./logging')
const { validate } = require('./validation')
const { loadFile } = require('./yaml')

const GLOBAL_CONFIG_SCHEMA = {
  properties: {
    values: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
    valuesSchema: {
      type: 'object',
    },
    defaultValues: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
    resourceDir: { type: 'string' },
    templateDir: { type: 'string' },
  },
  required: ['templateDir', 'resourceDir'],
  anyOf: [{ required: ['defaultValues'] }, { required: ['values'] }],
  additionalProperties: false,
}

const DEFAULT_RESOURCE_DIR = 'resources'
const DEFAULT_TEMPLATE_DIR = 'templates'

const getGlobalConfig = async ({ config = './confz.yaml' }) => {
  const configFilePath = await resolvePaths([config])

  const homeDir = await getDirectoryPath(configFilePath)
  log.info(`Global Config: home directory set to ${homeDir}`)

  const prelimGlobalConfig = {
    resourceDir: `${homeDir}/${DEFAULT_RESOURCE_DIR}`,
    templateDir: `${homeDir}/${DEFAULT_TEMPLATE_DIR}`,
    ...(await loadFile(config)),
  }
  log.info('Global Config: configuration file successfuly loaded')

  console.log(prelimGlobalConfig)

  validate(prelimGlobalConfig, GLOBAL_CONFIG_SCHEMA, configFilePath)

  const globalConfig = {
    values: await Promise.all(
      prelimGlobalConfig.values.map(path => resolvePaths([path]))
    ),
    valuesSchema: prelimGlobalConfig.valuesSchema,
    defaultValues: await Promise.all(
      prelimGlobalConfig.defaultValues.map(path => resolvePaths([path]))
    ),
    homeDir,
    resourceDir: await resolvePaths([prelimGlobalConfig.resourceDir]),
    templateDir: await resolvePaths([prelimGlobalConfig.templateDir]),
  }

  log.info('Global Config: all paths in configuration successfully resolved')

  return globalConfig
}

module.exports = { getGlobalConfig }
