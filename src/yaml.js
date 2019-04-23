const { FAILSAFE_SCHEMA, safeLoad, YAMLException } = require('js-yaml')

const { ConfzError } = require('./ConfzError')
const { readFile, resolvePaths } = require('./fs')
const { validate } = require('./validation')

class YamlException extends ConfzError {}

const loadFile = async (path, schema) => {
  try {
    const resolvedPath = await resolvePaths([path])
    const yamlDoc = await readFile(resolvedPath)
    const data = safeLoad(yamlDoc, {
      filename: resolvedPath,
      schema: FAILSAFE_SCHEMA,
    })

    if (schema) {
      validate(data, schema, resolvedPath)
    }

    return data
  } catch (err) {
    if (err instanceof ConfzError) {
      throw err
    }

    log.error(`YAML: error loading ${resolvedPath}: ${err.message}`)
    throw new YamlException(`Error loading ${resolvedPath}: ${err.message}`)
  }
}

module.exports = { loadFile }
