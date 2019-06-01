const { VError } = require('verror')

const { getDirectoryPath, resolvePaths } = require('./fs')
const { loadFileAtPath } = require('./util')
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
      type: 'string',
      format: 'uri-reference',
    },
    filterDir: { type: 'string', format: 'uri-reference' },
    resourceDir: { type: 'string', format: 'uri-reference' },
    templateDir: { type: 'string', format: 'uri-reference' },
  },
  required: ['filterDir', 'resourceDir', 'templateDir'],
  anyOf: [{ required: ['defaultValues'] }, { required: ['values'] }],
  additionalProperties: false,
}

const ERROR_NAME = 'GlobalConfig'
const DEFAULT_FILTER_DIR = 'filters'
const DEFAULT_RESOURCE_DIR = 'resources'
const DEFAULT_TEMPLATE_DIR = 'templates'
const DEFAULT_VALUES_SCHEMA = 'schema.yaml'

const getGlobalConfig = async argv => {
  let configFilePath
  try {
    const configFilePath = await resolvePaths([argv.config])

    const homeDir = await getDirectoryPath(configFilePath)

    const prelimGlobalConfig = {
      filterDir: `${homeDir}/${DEFAULT_FILTER_DIR}`,
      resourceDir: `${homeDir}/${DEFAULT_RESOURCE_DIR}`,
      templateDir: `${homeDir}/${DEFAULT_TEMPLATE_DIR}`,
      valuesSchema: `${homeDir}/${DEFAULT_VALUES_SCHEMA}`,
      valuesExtensions: ['json', 'yml', 'yaml'],
      ...(await loadFile(configFilePath)),
    }

    validate(prelimGlobalConfig, GLOBAL_CONFIG_SCHEMA)

    return {
      ...argv,
      values: await Promise.map(prelimGlobalConfig.values, path =>
        resolvePaths([path])
      ),
      valuesExtensions: prelimGlobalConfig.valuesExtensions,
      valuesSchema: await loadFileAtPath(prelimGlobalConfig.valuesSchema),
      defaultValues: await Promise.map(prelimGlobalConfig.defaultValues, path =>
        resolvePaths([path])
      ),
      homeDir,
      filterDir: await resolvePaths([prelimGlobalConfig.filterDir]),
      resourceDir: await resolvePaths([prelimGlobalConfig.resourceDir]),
      templateDir: await resolvePaths([prelimGlobalConfig.templateDir]),
    }
  } catch (cause) {
    throw new VError(
      {
        cause,
        name: ERROR_NAME,
        info: {
          configPath: configFilePath || argv.config,
        },
      },
      `Error initializing global configuration`
    )
  }
}

module.exports = { getGlobalConfig }
