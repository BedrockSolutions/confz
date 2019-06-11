const { flow, omitBy, pickBy } = require('lodash/fp')
const yargs = require('yargs')

const { display, run, validate, watch } = require('./commands')
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
    process.exit(-1)
  }
}

const processCommandLine = () => yargs
  .usage('$0 <command> [options]')
  .option('config', {
    desc: 'Location of the confz.yaml file.',
    type: 'string',
    default: './confz.d/confz.yaml',
    demandOption: true,
  })
  .option('print-stack', {
    desc: 'Print a stack trace when an error occurs.',
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
    builder: yargs => yargs
      .option('no-reload', {
        desc: 'Do not run resource check and reload commands.',
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
        desc: 'Exit if an error occurs.',
        type: 'boolean',
        default: false,
      })
      .option('no-reload', {
        desc: 'Do not run resource check and reload commands.',
        type: 'boolean',
        default: false,
      })
      .option('run-now', {
        desc: 'Execute a processing run immediately after initialization.',
        type: 'boolean',
        default: false,
      }),
    handler: executeCommand(watch),
  })
  .command({
    command: 'display <source>',
    desc: 'Display various types of confz data.',
    builder: yargs => yargs
      .positional('source', {
        desc: 'The source of data',
        type: 'string',
        choices: ['output', 'schema', 'values']
      }),
    handler: executeCommand(display),
  })
  .command({
    command: 'validate',
    desc: 'Validate the current values and exit.',
    handler: executeCommand(validate),
  })
  .demandCommand(1, 1, 'Please enter a command.')
  .help()
  .epilog('Bedrock Solutions, 2019')
  .strict()
  .parse()

module.exports = { processCommandLine }
