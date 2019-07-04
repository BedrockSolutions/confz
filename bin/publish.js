const chalk = require('chalk')
const { spawnSync } = require('child_process')

const {
  version,
} = require('../package.json')

const TAG_PREFIX = 'bedrocksolutions/confz'

const exec = cmdArgs => {
  console.log(chalk.green(`docker ${cmdArgs.join(' ')}`))
  spawnSync('docker', cmdArgs, {stdio: 'inherit'})
}

const getTag = () => `${TAG_PREFIX}:v${version}`

const dockerBuild = () =>
  exec(['build', '-t', getTag(), '.'])

const dockerPush = () =>
  exec(['push', getTag()])

dockerBuild()
dockerPush()
