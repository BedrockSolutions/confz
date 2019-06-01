const {flow, map} = require('awaity/fp')
const { flatten, isArray, isFunction, mergeAllWith } = require('lodash/fp')
const { VError } = require('verror')

const { getFilesForPath } = require('./fs')
const { loadFileAtPath } = require('./util')
const { validate } = require('./validation')

const ERROR_NAME = 'Values'

const mergeValues = values =>
  mergeAllWith((objValue, srcValue) => isArray(objValue) || isArray(srcValue) ? srcValue : undefined)([{}, ...values])

const getValues = async ({
  values,
  defaultValues,
  valuesExtensions,
  valuesSchema,
}) => {
  try {
    const valuesWithoutDefaults = await flow([
      map(async path => getFilesForPath(path, { allowedFiles: valuesExtensions.join('|') })),
      flatten,
      map(loadFileAtPath),
      mergeValues,
    ], values)

    const finalValues = await flow([
      map(loadFileAtPath),
      map(objOrFunc => isFunction(objOrFunc) ? objOrFunc(valuesWithoutDefaults): objOrFunc),
      values => mergeValues([...values, valuesWithoutDefaults])
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

module.exports = { getValues }
