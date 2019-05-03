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
    const allValuesPaths = await getAllValuesPaths(values, defaultValues, valuesExtensions)

    const allValuesObjects = await getAllValuesObjects(allValuesPaths)

    const mergedValues = allValuesObjects.reduce(merge, [])
    
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

const getAllValuesPaths = async (values, defaultValues, valuesExtensions) =>
  Promise.reduce(
    [...defaultValues, ...values],
    async (memo, path) => {
      const files = await getFilesForPath(path, {
        allowedExtensions: valuesExtensions,
      })
      return [...memo, ...files]
    },
    []
  )

const getAllValuesObjects = async valuesPaths => Promise.map(valuesPaths, p => loadFile(p))

module.exports = { getValues }
