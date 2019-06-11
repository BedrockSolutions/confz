const { DEFAULT_SAFE_SCHEMA, safeDump, safeLoad } = require('js-yaml')
const { VError } = require('verror')

const { readFile, resolvePaths } = require('./fs')
const { validate } = require('./validation')

const ERROR_NAME = 'Yaml'

const loadFile = async (path, schema) => {
  let yamlPath
  try {
    yamlPath = await resolvePaths([path])
    const yamlDoc = await readFile(yamlPath)
    const data = safeLoad(yamlDoc, {
      filename: yamlPath,
      schema: DEFAULT_SAFE_SCHEMA,
    })

    if (schema) {
      validate(data, schema)
    }

    return data
  } catch (cause) {
    throw new VError(
      {
        cause,
        name: ERROR_NAME,
        info: {
          yamlPath,
        },
      },
      `Error loading ${yamlPath}`
    )
  }
}

const toYaml = data => {
  try {
    return safeDump(data, { schema: DEFAULT_SAFE_SCHEMA })
  } catch (cause) {
    throw new VError(
      {
        cause,
        name: ERROR_NAME,
        info: {
          data,
        },
      },
      `Error converting to YAML`
    )
  }
}

module.exports = { loadFile, toYaml }
