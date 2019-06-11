Promise = require('bluebird')

const { processCommandLine } = require('./cli')
const { traverseError } = require('./errors')
const { log } = require('./logging')

process.on('unhandledRejection', err => {
  log.error('Unhandled promise rejection')
  traverseError(err)
})

processCommandLine()
