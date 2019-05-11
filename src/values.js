const {flow, map, reduce} = require('awaity/fp')
const { defaultsDeep } = require('lodash')
const { flatten, merge, reverse } = require('lodash/fp')
const nodeFileEval = require('node-file-eval');
const { extname } = require('path')
const { VError } = require('verror')

const { getFilesForPath, readFile } = require('./fs')
const { validate } = require('./validation')
const { loadFile } = require('./yaml')

const ERROR_NAME = 'Values'

const getValues = async ({
  values,
  defaultValues,
  valuesExtensions,
  valuesSchema,
}) => {
  try {
    const valuesWithoutDefaults = await flow([
      map(async path => getFilesForPath(path, { allowedExtensions: valuesExtensions })),
      flatten,
      map(loadFileAtPath),
      reduce(merge, {}),
    ], values)

    const finalValues = await flow([
      reverse,
      map(async path => loadFileAtPath(path, valuesWithoutDefaults)),
      reduce(defaultsDeep, valuesWithoutDefaults)
    ], defaultValues)

    if (valuesSchema) {
      validate(finalValues, valuesSchema)
    }

    return finalValues
  } catch (cause) {
    throw new VError(
      {
        cause,
        name: ERROR_NAME,
        info: {
          values,
          defaultValues,
        },
      },
      `Error loading values`
    )
  }
}

const loadFileAtPath = async (path, values) => {
  const ext = extname(path)

  switch (ext) {
    case '.js':
      return (await nodeFileEval(path))(values)

    case '.json':
      return JSON.parse(await readFile(path))

    case '.yml':
    case '.yaml':
      return loadFile(path)
  }
}

module.exports = { getValues }
