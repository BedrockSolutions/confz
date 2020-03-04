const { isFunction } = require('lodash/fp')
const nodeFileEval = require('node-file-eval')
const nunjucks = require('nunjucks')
const { parse } = require('path')
const { VError } = require('verror')

const { getFilesForPath } = require('./fs')
const { log } = require('./logging')

let environment

const ERROR_NAME = 'Templates'

let templateDir, filterDir

const initTemplates = async globalConfig => {
  templateDir = globalConfig.templateDir
  filterDir = globalConfig.filterDir

  try {
    environment = nunjucks.configure(templateDir, {
      autoescape: false,
      throwOnUndefined: true,
    })

    const filterPaths = await getFilesForPath(filterDir, {
      allowedFiles: '^.*.js$',
      ignoredFiles: '.*node_modules.*',
    })
    await Promise.each(filterPaths, async path => {
      try {
        const module = await nodeFileEval(path)

        if (isFunction(module)) {
          const name = parse(path).name
          environment.addFilter(name, module)
          log.info(`Filter '${name}' added`)
        } else {
          Object.entries(module).forEach(([name, filter]) => {
            environment.addFilter(name, filter)
            log.info(`Filter '${name}' added`)
          })
        }
      } catch (cause) {
        throw new VError(
          {
            cause,
            name: ERROR_NAME,
            info: {
              filterPath: path,
            },
          },
          `Error loading filter at ${path}`
        )
      }
    })
  } catch (cause) {
    throw new VError(
      {
        cause,
        name: ERROR_NAME,
        info: {
          filterDir,
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
          filterDir,
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
    return environment.addGlobal('this', values).render(templatePath, values)
  } catch (cause) {
    throw new VError(
      {
        cause,
        name: ERROR_NAME,
        info: {
          filterDir,
          templateDir,
          templatePath,
        },
      },
      `Error rendering template at ${templatePath}`
    )
  }
}

module.exports = { initTemplates, renderTemplate, verifyTemplatePath }
