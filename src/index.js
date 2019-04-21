const { log } = require('./logging')
const { getArguments } = require('./commandLine')
const { ConfzError } = require('./ConfzError')
const { getGlobalConfig } = require('./globalConfig')

const main = async () => {
  try {
    const commandArgs = getArguments()
    const globalConfing = await getGlobalConfig(commandArgs)
  } catch (err) {
    if (!(err instanceof ConfzError)) {
      log.error('An unknown error has occurred: ', err)
    }
  }
}

main()
