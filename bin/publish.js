const chalk = require('chalk')
const { spawnSync } = require('child_process')

const { version } = require('../package.json')

const TAG_PREFIX = 'bedrocksolutions/confz'

const dockerExec = cmdArgs => {
  console.log(chalk.green(`docker ${cmdArgs.join(' ')}`))
  spawnSync('docker', cmdArgs, { stdio: 'inherit' })
}

const getTag = () => `${TAG_PREFIX}:v${version}`

const dockerBuild = () => dockerExec(['build', '-t', getTag(), '.'])

const dockerPush = () => dockerExec(['push', getTag()])

dockerBuild()
dockerPush()
