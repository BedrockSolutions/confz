const {VError} = require('verror')

const execAsync = Promise.promisify(require('child_process').exec, {multiArgs: true})

const ERROR_NAME = 'Exec'

const exec = async cmd => {
  try {
    await execAsync(cmd)
  } catch (cause) {
    throw new VError(
      {
        cause,
        name: ERROR_NAME,
        info: {
          cmd,
        },
      },
      `Error executing command ${cmd}`
    )
  }
}

module.exports = { exec }
