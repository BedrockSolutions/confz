Promise = require('bluebird')

const chalk = require('chalk')
const { VError, MultiError } = require('verror')

const { log } = require('./logging')
const { getArguments } = require('./commandLine')
const { getGlobalConfig } = require('./globalConfig')
const { initResources, processResources } = require('./resources')
const { initTemplates } = require('./templates')
const { getValues } = require('./values')
const { watchValues } = require('./watch')

const main = async () => {
  let commandArgs
  try {
    commandArgs = getArguments()
    log.info(`Command line: ${JSON.stringify(commandArgs)}`)

    const globalConfig = await getGlobalConfig(commandArgs)
    log.info('Global configuration initialized')

    await initTemplates(globalConfig.templateDir)
    log.info('Templates initialized')

    await initResources(globalConfig.resourceDir)
    log.info('Resources initialized')

    const valuesToRenderedTemplates = async () => {
      const values = await getValues(globalConfig)
      log.info('Values loaded')

      await processResources(values)
      log.info('Resource processing complete')
    }

    await valuesToRenderedTemplates()
    log.info('Initial render complete')

    if (!globalConfig.onetime) {
      await watchValues(globalConfig, async () => {
        try {
          await valuesToRenderedTemplates()
        } catch (err) {
          traverseError(err, commandArgs)
        }
      })
      log.info('Values watcher initialized')
    }
  } catch (err) {
    traverseError(err, commandArgs)
  }
}

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
      log.error(chalk`{yellowBright Module:} {green ${e.name}}`)
      log.error(chalk`{yellowBright Message:} {cyanBright ${e.message}}`)
      Object.entries(VError.info(e)).forEach(([key, value]) =>
        log.error(
          chalk`{yellowBright Info:} {magentaBright ${key}}: {blueBright ${value}}`
        )
      )
    })
  } else {
    log.error('An unknown error has occurred')
    log.error(err.message)
  }

  if (commandArgs && commandArgs.printstack) {
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

main()
