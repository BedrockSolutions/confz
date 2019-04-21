const { log } = require('./logging')
const { pick } = require('lodash/fp')

getArguments = () => {
  const { argv } = require('yargs')
    .strict()
    .usage('$0 [ --config /path/to/confz.yaml ] [ --onetime ]')
    .option('config', {
      describe: 'Location of the confz.yaml file',
      type: 'string',
    })
    .option('onetime', {
      describe: 'Run once and exit',
      type: 'boolean',
    })
    .check(({ config }) => {
      if (config !== undefined && !config.endsWith('confz.yaml')) {
        throw new Error(
          "The '--config' option must include a path to confz.yaml."
        )
      }
      return true
    })
    .epilog('Copyright Bedrock Solutions, 2019')

  const cleanedArgs = pick(['config', 'onetime'], argv)

  log.info(`Command args: ${JSON.stringify(cleanedArgs)}`)

  return cleanedArgs
}

module.exports = { getArguments }
