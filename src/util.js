const {log} = require('./logging')

const displayMultilineText = text => text.split(/\r?\n/).forEach(line => log.info(line))

module.exports = { displayMultilineText }
