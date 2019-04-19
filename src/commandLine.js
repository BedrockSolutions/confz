const { log } = require('./logging')
const { pick } = require('lodash/fp')

getArguments = () => {
  const { argv } = require('yargs')
    .strict()
    .usage('$0 [ --config /path/to/confz.yaml ] [ --onetime ]')
    .option('c', {
      alias: 'config',
      describe: 'Location of confz.yaml file',
      type: 'string',
    })
    .option('o', {
      alias: 'onetime',
      describe: 'Run once and exit',
      type: 'boolean',
    })
    .check(argv => !!argv.config)
    .epilog('Copyright Bedrock Solutions, 2019')

  const cleanedArgs = pick(['config', 'onetime'], argv)

  log.info(`Command args: ${JSON.stringify(cleanedArgs)}`)

  return cleanedArgs
}

module.exports = { getArguments }
