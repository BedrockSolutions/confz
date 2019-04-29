const { concat, merge } = require('lodash/fp')
const { VError } = require('verror')

const { getFilesForPath } = require('./fs')
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
    const allValuesPaths = await Promise.reduce(
      [...defaultValues, ...values],
      async (memo, path) => {
        const files = await getFilesForPath(path, {
          allowedExtensions: valuesExtensions,
        })
        console.log(path, files)
        return [...memo, ...files]
      },
      []
    )

    const mergedValues = await Promise.reduce(
      allValuesPaths,
      async (memo, path) => merge(memo, await loadFile(path)),
      {}
    )

    console.log(mergedValues)

    if (valuesSchema) {
      validate(mergedValues, valuesSchema)
    }

    return mergedValues
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
