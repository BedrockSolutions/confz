const jsonToMarkdown = require('json-schema-to-markdown')
const marked = require('marked')
const TerminalRenderer = require('marked-terminal')
const { VError } = require('verror')

const { log } = require('./logging')

// marked.setOptions({
//   renderer: new TerminalRenderer()
// });

const ERROR_NAME = 'Display Schema'

const displaySchemaAsHtml = schema => {
  try {
    const markdown = jsonToMarkdown(schema)
    console.log(markdown)
    const terminalText = marked(markdown)
    console.log(marked(markdown))
    // log.info('')
    // terminalText.split(/\r?\n/).forEach(line => log.info(line))
  } catch (cause) {
    throw new VError(
      {
        cause,
        name: ERROR_NAME,
      },
      `Error displaying schema`
    )
  }
}

module.exports = { displaySchemaAsHtml }
