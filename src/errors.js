const chalk = require('chalk')
const { VError, MultiError } = require('verror')

const { log } = require('./logging')

const traverseError = (err, commandArgs) => {
  if (err instanceof VError) {
    if (err instanceof MultiError) {
      err.errors().forEach(e => traverseError(e, commandArgs))
    } else {
      displayError(err, commandArgs)
      const cause = VError.cause(err)
      if (cause instanceof MultiError) {
        traverseError(cause, commandArgs)
      }
    }
  } else {
    displayError(err, commandArgs)
  }
}

const displayError = (err, commandArgs) => {
  displayDashedLine()

  if (err instanceof VError) {
    VError.errorForEach(err, e => {
      log.error(chalk`{yellow Module:} {green ${e.name}}`)
      log.error(chalk`{yellow Message:} {red ${e.message}}`)
      Object.entries(VError.info(e)).forEach(([key, value]) =>
        log.error(
          chalk`{yellow Info:} {magentaBright ${key}}: {blueBright ${displayInfoValue(
            value
          )}}`
        )
      )
    })
  } else {
    log.error('An unknown error has occurred')
    log.error(err.message)
  }

  if (commandArgs && commandArgs.printStack) {
    displayStackTrace(err)
  }
}

const displayDashedLine = () =>
  log.error(chalk`{yellow -------------------------}`)

const displayStackTrace = err => {
  if (err instanceof VError) {
    log.error(VError.fullStack(err))
  } else {
    log.error(err.stack)
  }
}

const displayInfoValue = value =>
  ['object', 'array'].includes(typeof value) ? JSON.stringify(value) : value

module.exports = { traverseError }
