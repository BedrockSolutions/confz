const Ajv = require('ajv')
const { log } = require('./logging')

const GLOBAL_CONFIG_SCHEMA = {
  properties: {
    templateDir: { type: 'string' },
    resourceDir: { type: 'string' },
    defaultData: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
    data: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
    dataSchema: {
      type: 'object',
    },
  },
  required: ['templateDir', 'resourceDir'],
  anyOf: [{ required: ['defaultData'] }, { required: ['data'] }],
  additionalProperties: false,
}

const getGlobalConfig = async commandArgs => {
  // Steps:
  // 1. Read file with fs.readFile
  // 2. Parse file with js-yaml
  // 3. Merge global config with confz default config and command args overrides
  // default config -> confz.yaml -> command args = final global config
  // 4. Validate global config against confz JSON schema
  const ajv = new Ajv({ allErrors: true })

  const data = {
    templateDir: ['/foo/bar'],
    resourceDir: '/a/b/c',
    data: ['/hello/world'],
    defaultData: ['/z/y/x'],
  }

  var valid = ajv.validate(GLOBAL_CONFIG_SCHEMA, data)
  if (!valid) {
    log.error('validation error', ajv.errors)
    console.log(ajv.errors)
  } else {
    console.log('No Errors')
  }

  return null
}

module.exports = { getGlobalConfig }
