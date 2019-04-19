const { log } = require('./logging')
const { getArguments } = require('./commandLine')
const { getGlobalConfig } = require('./globalConfig')

const argv = getArguments()

getGlobalConfig(argv)

console.log(argv)
