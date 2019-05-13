const { VError } = require('verror')

const {exec} = require('./exec')
const {
  getFilesForPath,
  readFile,
  resolvePaths,
  writeFile,
} = require('./fs')
const { log } = require('./logging')
const { renderTemplate, verifyTemplatePath } = require('./templates')
const { validate } = require('./validation')
const { loadFile } = require('./yaml')

const ERROR_NAME = 'Resources'

const RESOURCE_SCHEMA = {
  properties: {
    src: {
      type: 'string',
      format: 'uri-reference',
    },
    dest: {
      type: 'string',
      format: 'uri-reference',
    },
    owner: {
      type: 'integer',
      minimum: 0,
    },
    group: {
      type: 'integer',
      minimum: 0,
    },
    mode: {
      type: 'integer',
      pattern: '^[4567][0124567]{2}$',
    },
    checkCmd: {
      type: 'string',
    },
    reloadCmd: {
      type: 'string',
    },
  },
  required: ['src', 'dest'],
  additionalProperties: false,
  oneOf: [
    {
      required: ['owner', 'group']
    },
    {
      properties: {
        owner: {
          type: 'null',
        },
        group: {
          type: 'null',
        }
      }
    },
  ]
}

let noReload, resources

const initResources = async ({noReload: _noReload, resourceDir}) => {
  noReload = _noReload

  let resourcePaths
  try {
    resourcePaths = await getFilesForPath(resourceDir)
  } catch (cause) {
    throw new VError(
      {
        cause,
        name: ERROR_NAME,
        info: {
          resourceDir,
        },
      },
      `Error initializing resources at ${resourceDir}`
    )
  }

  resources = await Promise.map(resourcePaths, async resourcePath => {
    let resource
    try {
      resource = await loadFile(resourcePath)

      validate(resource, RESOURCE_SCHEMA, resourcePath)
      verifyTemplatePath(resource.src)

      resource.dest = await resolvePaths([resource.dest], {
        doesFileExist: false,
        isWritable: true,
      })

      resource.path = resourcePath

      return resource
    } catch (cause) {
      throw new VError(
        {
          cause,
          name: ERROR_NAME,
          info: {
            ...(resource || {}),
            resourceDir,
            resourcePath,
          },
        },
        `Error initializing resources at ${resourceDir}`
      )
    }
  })
}

const processResources = async values => {
  let changedResources = []

  await Promise.each(resources, async r => {
    try {
      let resourceChanged = false

      const oldRenderedTemplate = await readFile(r.dest, {
        ignoreMissingFile: true,
      })
      const newRenderedTemplate = await renderTemplate(r.src, values)

      if (oldRenderedTemplate !== newRenderedTemplate) {
        await writeFile(r.dest, newRenderedTemplate, {mode: r.mode && parseInt(r.mode.toString(10), 8), owner: r.owner, group: r.group})
        resourceChanged = true
        log.info(`Wrote file '${r.dest}'`)
      }

      if (resourceChanged) {
        changedResources.push(r)
      }
    } catch (cause) {
      throw new VError(
        {
          cause,
          name: ERROR_NAME,
          info: r,
        },
        `Error processing resource`
      )
    }
  })

  if (!noReload) {
    await Promise.each(changedResources, async r => {
      try {
        if (r.reloadCmd) {
          if (r.checkCmd) {
            await exec(r.checkCmd)
            log.info(`Check command '${r.checkCmd}' run`)
          }
          await exec(r.reloadCmd)
          log.info(`Reload command '${r.reloadCmd}' run`)
        }
      } catch (cause) {
        throw new VError(
          {
            cause,
            name: ERROR_NAME,
            info: r,
          },
          `Error executing resource command`
        )
      }
    })
  }
}

module.exports = { initResources, processResources }
