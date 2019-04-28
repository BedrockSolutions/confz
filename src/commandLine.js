const { pick } = require('lodash/fp')

getArguments = () => {
  const { argv } = require('yargs')
    .usage('$0 [ --config /path/to/confz.yaml ] [ --onetime ] [ --printstack ]')
    .option('config', {
      describe: 'Location of the confz.yaml file',
      type: 'string',
    })
    .option('onetime', {
      describe: 'Run once and exit',
      type: 'boolean',
    })
    .option('printstack', {
      describe: 'Print a stack trace when an error occurs',
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
    .strict()

  return pick(['config', 'onetime', 'printstack'], argv)
}

module.exports = { getArguments }
