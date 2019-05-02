const { VError } = require('verror')

const { getDirectoryPath, resolvePaths } = require('./fs')
const { validate } = require('./validation')
const { loadFile } = require('./yaml')

const GLOBAL_CONFIG_SCHEMA = {
  properties: {
    defaultValues: {
      type: 'array',
      items: {
        type: 'string',
        format: 'uri-reference',
      },
    },
    values: {
      type: 'array',
      items: {
        type: 'string',
        format: 'uri-reference',
      },
    },
    valuesExtensions: {
      type: 'array',
      items: {
        type: 'string',
        pattern: '^[a-z]+$',
      },
    },
    valuesSchema: {
      type: 'object',
    },
    resourceDir: { type: 'string', format: 'uri-reference' },
    templateDir: { type: 'string', format: 'uri-reference' },
  },
  required: ['templateDir', 'resourceDir'],
  anyOf: [{ required: ['defaultValues'] }, { required: ['values'] }],
  additionalProperties: false,
}

const ERROR_NAME = 'GlobalConfig'
const DEFAULT_RESOURCE_DIR = 'resources'
const DEFAULT_TEMPLATE_DIR = 'templates'

const getGlobalConfig = async ({
  config = './confz.yaml',
  onetime = false,
  printstack = false,
}) => {
  let configFilePath
  try {
    const configFilePath = await resolvePaths([config])

    const homeDir = await getDirectoryPath(configFilePath)

    const prelimGlobalConfig = {
      resourceDir: `${homeDir}/${DEFAULT_RESOURCE_DIR}`,
      templateDir: `${homeDir}/${DEFAULT_TEMPLATE_DIR}`,
      valuesExtensions: ['yml', 'yaml'],
      ...(await loadFile(configFilePath)),
    }

    validate(prelimGlobalConfig, GLOBAL_CONFIG_SCHEMA, configFilePath)

    const globalConfig = {
      values: await Promise.map(prelimGlobalConfig.values, path =>
        resolvePaths([path])
      ),
      valuesExtensions: prelimGlobalConfig.valuesExtensions,
      valuesSchema: prelimGlobalConfig.valuesSchema,
      defaultValues: await Promise.map(prelimGlobalConfig.defaultValues, path =>
        resolvePaths([path])
      ),
      homeDir,
      onetime,
      resourceDir: await resolvePaths([prelimGlobalConfig.resourceDir]),
      templateDir: await resolvePaths([prelimGlobalConfig.templateDir]),
    }

    return globalConfig
  } catch (cause) {
    throw new VError(
      {
        cause,
        name: ERROR_NAME,
        info: {
          configPath: configFilePath || config,
        },
      },
      `Error initializing global configuration`
    )
  }
}

module.exports = { getGlobalConfig }
