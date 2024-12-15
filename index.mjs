import OpenAI from 'openai'
import toml from 'toml'
import TOMLStream from 'toml-stream'
import fs from 'fs'
import path from 'path'
import minimist from 'minimist'

const home = process.env.HOME

if (!fs.existsSync(`${home}/.oai-cli.toml`)) {
  console.error('Please create ~/.oai-cli.toml')
  process.exit(1)
}

const config = toml.parse(fs.readFileSync(`${home}/.oai-cli.toml`, 'utf8'))

const argv = minimist(process.argv.slice(2), {
  string: ['file', 'model', 'output', 'endpoint'],
  number: ['temperature'],
  alias: {
    f: 'file',
    m: 'model',
    o: 'output',
    e: 'endpoint',
    t: 'temperature',
    temp: 'temperature',
  },
})

const oai = new OpenAI({
  baseURL: argv['endpoint'] || config.baseURL,
  apiKey: config.apiKey || process.env.OPENAI_API_KEY || 'NOPE',
})

if (!argv['file']) {
  console.error('Please provide a file')
  process.exit(1)
}

const pwd = process.cwd()
const file = path.resolve(pwd, argv['file'])

const { messages } = toml.parse(fs.readFileSync(file, 'utf8'))

const response = await oai.chat.completions.create({
  model: argv['model'] || config.defaultModel,
  messages,
  max_tokens: -1,
  temperature: argv['temperature'] || 0.8,
  stream: true,
})

let content = ''

for await (const chunk of response) {
  const delta = chunk.choices[0].delta.content
  if (delta) {
    content += delta
    process.stdout.write(delta)
  }
}

const out = path.resolve(pwd, argv['output'] || `${argv['file']}.out`)
TOMLStream.toTOMLString(
  {
    messages: [
      ...messages,
      {
        role: 'assistant',
        content,
      },
    ],
  },
  (err, data) => {
    fs.writeFileSync(out, data)
  },
)
