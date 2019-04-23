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
        format: 'uri-reference',
      },
    },
    valuesSchema: {
      type: 'object',
    },
    defaultValues: {
      type: 'array',
      items: {
        type: 'string',
        format: 'uri-reference',
      },
    },
    resourceDir: { type: 'string', format: 'uri-reference' },
    templateDir: { type: 'string', format: 'uri-reference' },
  },
  required: ['templateDir', 'resourceDir'],
  anyOf: [{ required: ['defaultValues'] }, { required: ['values'] }],
  additionalProperties: false,
}

const DEFAULT_RESOURCE_DIR = 'resources'
const DEFAULT_TEMPLATE_DIR = 'templates'

const getGlobalConfig = async ({
  config = './confz.yaml',
  onetime = false,
}) => {
  const configFilePath = await resolvePaths([config])

  const homeDir = await getDirectoryPath(configFilePath)
  log.info(`Global Config: home directory set to ${homeDir}`)

  const prelimGlobalConfig = {
    resourceDir: `${homeDir}/${DEFAULT_RESOURCE_DIR}`,
    templateDir: `${homeDir}/${DEFAULT_TEMPLATE_DIR}`,
    ...(await loadFile(config)),
  }
  log.info('Global Config: configuration file successfuly loaded')

  validate(prelimGlobalConfig, GLOBAL_CONFIG_SCHEMA, configFilePath)

  const globalConfig = {
    values: await Promise.map(prelimGlobalConfig.values, path =>
      resolvePaths([path])
    ),
    valuesSchema: prelimGlobalConfig.valuesSchema,
    defaultValues: await Promise.map(prelimGlobalConfig.defaultValues, path =>
      resolvePaths([path])
    ),
    homeDir,
    onetime,
    resourceDir: await resolvePaths([prelimGlobalConfig.resourceDir]),
    templateDir: await resolvePaths([prelimGlobalConfig.templateDir]),
  }

  log.info('Global Config: all paths in configuration successfully resolved')

  return globalConfig
}

module.exports = { getGlobalConfig }
