const { log } = require('./logging')
const { getArguments } = require('./commandLine')
const { ConfzError } = require('./ConfzError')
const { getGlobalConfig } = require('./globalConfig')

const { getFilesForPath } = require('./fs')
const main = async () => {
  try {
    const commandArgs = getArguments()
    const globalConfig = await getGlobalConfig(commandArgs)

    const files = await getFilesForPath(globalConfig.templateDir)

    console.log(files)
  } catch (err) {
    if (!(err instanceof ConfzError)) {
      log.error('An unknown error has occurred: ', err)
      console.log(err.stack)
    }
  }
}

main()
