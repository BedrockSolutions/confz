const { traverseError } = require('./errors')
const { getGlobalConfig } = require('./globalConfig')
const { log } = require('./logging')
const { initResources, processResources } = require('./resources')
const { displaySchema } = require('./schema')
const { initTemplates } = require('./templates')
const { getValues } = require('./values')
const { watchValues } = require('./watch')

const initCore = async argv => {
  const globalConfig = await getGlobalConfig(argv)
  log.info('Global configuration initialized')

  await initTemplates(globalConfig)
  log.info('Templates initialized')

  await initResources(globalConfig)
  log.info('Resources initialized')

  return globalConfig
}

const createValuesToRenderedTemplates = globalConfig => async () => {
  const values = await getValues(globalConfig)
  log.info('Values loaded')

  await processResources(values)
  log.info('Resource processing complete')
}

const run = async argv => {
  const globalConfig = await initCore(argv)
  await createValuesToRenderedTemplates(globalConfig)()
}

const schema = async argv => {
  const {valuesSchema} = await getGlobalConfig(argv)
  displaySchema(valuesSchema)
}

const watch = async argv => {
  const globalConfig = await initCore(argv)
  const valuesToRenderedTemplates = createValuesToRenderedTemplates(globalConfig)

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

module.exports = { run, schema, watch }