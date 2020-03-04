const { flow } = require('awaity/fp')
const chalk = require('chalk')
const { get, invoke, forEach } = require('lodash/fp')

const { traverseError } = require('./errors')
const { getGlobalConfig } = require('./globalConfig')
const { log } = require('./logging')
const { initResources, processResources } = require('./resources')
const { initTemplates } = require('./templates')
const { displayMultilineText } = require('./util')
const { getValues } = require('./values')
const { watchValues } = require('./watch')
const { toYaml } = require('./yaml')

const initCore = async argv => {
  const globalConfig = await getGlobalConfig(argv)
  log.info('Global configuration initialized')

  await initTemplates(globalConfig)
  log.info('Templates initialized')

  await initResources(globalConfig)
  log.info('Resources initialized')

  const valuesToRenderedTemplates = async () => {
    const values = await getValues(globalConfig)
    log.info('Values loaded')

    const resources = await processResources(values)
    log.info('Resource processing complete')

    return resources
  }

  return {
    globalConfig,
    valuesToRenderedTemplates,
  }
}

const run = async argv => {
  const { valuesToRenderedTemplates } = await initCore(argv)
  await valuesToRenderedTemplates()
}

const validate = async argv => {
  const globalConfig = await getGlobalConfig(argv)
  const values = await getValues(globalConfig)
  log.info('Values are valid')
}

const display = async argv => {
  const { source } = argv

  switch (source) {
    case 'output':
      await flow([
        initCore,
        invoke('valuesToRenderedTemplates'),
        forEach(r => {
          if (r.renderedTemplate) {
            log.info('')
            log.info(
              chalk`{magentaBright [Source: ${r.src}, Destination: ${r.dest}]}`
            )
            displayMultilineText(r.renderedTemplate)
          }
        }),
      ])(argv)
      break

    case 'schema':
      log.info('')
      log.info(chalk`{magentaBright [Values Schema]}`)
      await flow([
        getGlobalConfig,
        get('valuesSchema'),
        toYaml,
        displayMultilineText,
      ])(argv)
      break

    case 'values':
      log.info('')
      log.info(chalk`{magentaBright [Values]}`)
      await flow([getGlobalConfig, getValues, toYaml, displayMultilineText])(
        argv
      )
      break
  }
}

const watch = async argv => {
  const { globalConfig, valuesToRenderedTemplates } = await initCore(argv)

  await watchValues(globalConfig, async () => {
    try {
      await valuesToRenderedTemplates()
    } catch (err) {
      traverseError(err, argv)
      if (argv.exitOnError) {
        process.exit(-1)
      }
    }
  })
  log.info('Values watcher initialized')
}

module.exports = { display, run, validate, watch }
