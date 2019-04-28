const nunjucks = require('nunjucks')
const { VError } = require('verror')

const { getFilesForPath, readFile } = require('./fs')
const { log } = require('./logging')

let environment

const ERROR_NAME = 'Templates'

let templateDir

const initTemplates = async _templateDir => {
  templateDir = _templateDir
  try {
    environment = nunjucks.configure(templateDir, { throwOnUndefined: true })
  } catch (cause) {
    throw new VError(
      {
        cause,
        name: ERROR_NAME,
        info: {
          templateDir,
        },
      },
      `Error initializing templates in ${templateDir}`
    )
  }
}

const verifyTemplatePath = templatePath => {
  try {
    environment.getTemplate(templatePath, true)
  } catch (cause) {
    throw new VError(
      {
        cause,
        name: ERROR_NAME,
        info: {
          templateDir,
          templatePath,
        },
      },
      `Error verifying template at ${templatePath}`
    )
  }
}

const renderTemplate = async (templatePath, values) => {
  try {
    return environment.render(templatePath, values)
  } catch (cause) {
    throw new VError(
      {
        cause,
        name: ERROR_NAME,
        info: {
          templateDir,
          templatePath,
        },
      },
      `Error rendering template at ${templatePath}`
    )
  }
}

module.exports = { initTemplates, renderTemplate, verifyTemplatePath }
