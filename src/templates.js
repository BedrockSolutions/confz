const nunjucks = require('nunjucks')

const { ConfzError } = require('./ConfzError')
const { getFilesForPath, readFile } = require('./fs')
const { log } = require('./logging')

let environment

class TemplateError extends ConfzError {}

const initTemplates = async templateDir => {
  try {
    environment = nunjucks.configure(templateDir, { throwOnUndefined: true })
  } catch (err) {
    log.error(
      `Templates: error initializing templates in ${templateDir}: ${
        err.message
      }`
    )
    throw new TemplateError(
      `Error initializing template dir ${templateDir}: ${err.message}`
    )
  }
}

const verifyTemplatePath = (fileName, { description = '' } = {}) => {
  try {
    environment.getTemplate(fileName, true)
  } catch (err) {
    log.error(
      `Templates: error accessing ${description &&
        description + ' '}${fileName}: ${err.message}`
    )
    throw new TemplateError(
      `No template found with name ${fileName}: ${err.message}`
    )
  }
}

const renderTemplate = async (fileName, values) => {
  try {
    return environment.render(fileName, values)
  } catch (err) {
    log.error(`Templates: error rendering template ${fileName}: ${err.message}`)
    throw new TemplateError(
      `Error rendering template ${fileName}: ${err.message}`
    )
  }
}

module.exports = { initTemplates, renderTemplate, verifyTemplatePath }
