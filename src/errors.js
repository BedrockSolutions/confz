class ConfzError extends Error {}

class ValidationError extends ConfzError {}

const validationError = message => new ValidationError(message)

module.exports = { validationError, ConfzError }
