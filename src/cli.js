const { flow, omitBy, pickBy } = require('lodash/fp')
const yargs = require('yargs')

const { run, schema, watch } = require('./commands')
const { traverseError } = require('./errors')
const { log } = require('./logging')

const displayOptions = flow([
  pickBy((_, key) => /^[-a-z]+$/.test(key)),
  omitBy(value => !value),
  JSON.stringify
])

const executeCommand = command => async argv => {
  log.info(`Command: "${argv['_'][0]}"`)
  log.info(`Options: ${displayOptions(argv)}`)

  try {
    await command(argv)
  } catch (err) {
    traverseError(err, argv)
  }
}

const processCommandLine = () => yargs
  .usage('$0 <command> [options]')
  .option('config', {
    describe: 'Location of the confz.yaml file.',
    type: 'string',
    default: './confz.d/confz.yaml',
    demandOption: true,
  })
  .option('print-stack', {
    describe: 'Print a stack trace when an error occurs.',
    type: 'boolean',
    default: false,
  })
  .check(({ config }) => {
    if (!config.endsWith('confz.yaml')) {
      throw new Error(
        "The '--config' option must include a path to confz.yaml."
      )
    }
    return true
  })
  .command({
    command: 'run',
    desc: 'Execute a single processing run and exit.',
    builder: yargs => yargs.option('no-reload', {
      describe: 'Do not run resource check and reload commands.',
      type: 'boolean',
      default: true,
    }),
    handler: executeCommand(run),
  })
  .command({
    command: 'watch',
    desc: 'Watch values files and execute a processing run upon changes.',
    builder: yargs => yargs
      .option('exit-on-error', {
        describe: 'Exit if an error occurs.',
        type: 'boolean',
        default: false,
      })
      .option('no-reload', {
        describe: 'Do not run resource check and reload commands.',
        type: 'boolean',
        default: false,
      })
      .option('run-now', {
        describe: 'Execute a processing run immediately after initialization.',
        type: 'boolean',
        default: false,
      }),
    handler: executeCommand(watch),
  })
  .command({
    command: 'schema',
    desc: 'Print the values schema and exit.',
    handler: executeCommand(schema),
  })
  .demandCommand(1, 1, 'Please enter a command: run, watch, schema.')
  .help()
  .epilog('Bedrock Solutions, 2019')
  .strict()
  .parse()

module.exports = { processCommandLine }
