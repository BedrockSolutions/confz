const Ajv = require('ajv')
const { flow, map } = require('lodash/fp')

const { ConfzError } = require('./ConfzError')
const { log } = require('./logging')

class ValidationError extends ConfzError {}

const validate = ({ data, schema, schemaName }) => {
  const ajv = new Ajv({ allErrors: true })

  const valid = ajv.validate(schema, data)

  if (valid) return

  log.error(
    `Validation: ${ajv.errors.length} error${
      ajv.errors.length > 1 ? 's' : ''
    } occurred when validating ${schemaName}.`
  )
  ajv
    .errorsText()
    .split(',')
    .forEach(err => log.error(`Validation: ${err.trim()}`))

  throw new ValidationError(
    `Error validating ${schemaName}: ${ajv.errorsText()}`
  )
}

module.exports = { validate }
