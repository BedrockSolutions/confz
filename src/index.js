Promise = require('bluebird')

const chalk = require('chalk')
const { VError, MultiError } = require('verror')

const { log } = require('./logging')
const { getArguments } = require('./commandLine')
const { ConfzError } = require('./ConfzError')
const { getGlobalConfig } = require('./globalConfig')
const { initResources } = require('./resources')
const { initTemplates, renderTemplate } = require('./templates')

const main = async () => {
  let commandArgs
  try {
    commandArgs = getArguments()
    log.info(`Command line: ${JSON.stringify(commandArgs)}`)

    const globalConfig = await getGlobalConfig(commandArgs)
    log.info('Global configuration file successfuly loaded')

    await initTemplates(globalConfig.templateDir)
    log.info('Templates initialized')

    await initResources(globalConfig.resourceDir)
    log.info('Resources initialized')

    console.log(await renderTemplate('template1.njk', { foo: 'bar' }))
  } catch (err) {
    displayDashedLine()
    traverseError(err, commandArgs)
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

  displayDashedLine()
}

// const renderTemplates = async ()

main()
