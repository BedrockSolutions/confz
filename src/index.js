Promise = require('bluebird')

const { log } = require('./logging')
const { getArguments } = require('./commandLine')
const { ConfzError } = require('./ConfzError')
const { getGlobalConfig } = require('./globalConfig')
const { initResources } = require('./resources')
const { initTemplates, renderTemplate } = require('./templates')

const main = async () => {
  try {
    const commandArgs = getArguments()
    const globalConfig = await getGlobalConfig(commandArgs)

    console.log(globalConfig)

    await initTemplates(globalConfig.templateDir)
    await initResources(globalConfig.resourceDir)

    console.log(await renderTemplate('template1.njk', { foo: 'bar' }))
  } catch (err) {
    if (!(err instanceof ConfzError)) {
      log.error('An unknown error has occurred: ', err)
      console.log(err.stack)
    }
  }
}

// const renderTemplates = async ()

main()
