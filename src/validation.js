const Ajv = require('ajv')
const { VError } = require('verror')

const ERROR_NAME = 'Validation'

const validate = (data, schema) => {
  const ajv = new Ajv({ allErrors: true })

  const valid = ajv.validate(schema, data)

  if (valid) return

  const errors = ajv.errors.map(
    info =>
      new VError(
        {
          name: ERROR_NAME,
          info,
        },
        `Error validating data`
      )
  )

  throw VError.errorFromList(errors)
}

module.exports = { validate }
