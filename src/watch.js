const chokidar = require('chokidar')
const { debounce } = require('lodash')
const { VError } = require('verror')

const DEBOUNCE_WAIT_IN_MILLIS = 100
const ERROR_NAME = 'File Watch'

const watchValues = async (
  { values = [], valuesExtensions = [] },
  onValuesChanged
) => {
  try {
    const watcherOptions = {
      awaitWriteFinish: true,
      ignoreInitial: true,
    }

    const watcher = chokidar.watch(values, watcherOptions)

    const debouncedOnValuesChanged = debounce(
      onValuesChanged,
      DEBOUNCE_WAIT_IN_MILLIS
    )

    watcher.on('all', async (event, path) => {
      if (valuesExtensions.some(ext => path.endsWith(ext))) {
        debouncedOnValuesChanged()
      }
    })
  } catch (cause) {
    throw new VError(
      {
        cause,
        name: ERROR_NAME,
        info: {
          values,
          defaultValues,
          valuesExtensions,
        },
      },
      `Error watching values files`
    )
  }
}

module.exports = { watchValues }
