#!/usr/bin/env node

import OpenAI from 'openai'
import toml from 'toml'
import TOMLStream from 'toml-stream'
import fs from 'fs'
import path from 'path'
import minimist from 'minimist'

const home = process.env.HOME

if (!fs.existsSync(`${home}/.oai-cli.toml`)) {
  fs.writeFileSync(
    `${home}/.oai-cli.toml`,
    'endpoint = "https://api.openai.com/v1"\n' +
      'model = "gpt-4o-mini"\n\n' +
      '[[configs]]\n' +
      'name = "default"\n' +
      'model = "gpt-4o-mini"\n' +
      'endpoint = "https://api.openai.com/v1/chat/completions"\n' +
      'apiKey = "sk-..."',
  )
}

const config = toml.parse(fs.readFileSync(`${home}/.oai-cli.toml`, 'utf8'))

const argv = minimist(process.argv.slice(2), {
  string: ['file', 'model', 'output', 'endpoint', 'config'],
  number: ['temperature'],
  alias: {
    f: 'file',
    m: 'model',
    o: 'output',
    e: 'endpoint',
    t: 'temperature',
    temp: 'temperature',
    c: 'config',
  },
})

let endpoint = argv['endpoint']
let model = argv['model'] || config.model
let apiKey = config.apiKey || process.env.OPENAI_API_KEY || 'NOPE'

if (argv['config']) {
  const configItem = config.configs.find((c) => c.name === argv['config'])
  if (!configItem) {
    console.error(`Config ${argv['config']} not found`)
    process.exit(1)
  }
  if (!configItem.endpoint) {
    console.error('Config endpoint is required')
    process.exit(1)
  }
  if (!config.model) {
    console.error('Config model is required')
    process.exit(1)
  }
  endpoint = configItem.endpoint
  model = configItem.model
  apiKey = configItem.apiKey || apiKey
}

const oai = new OpenAI({
  baseURL: endpoint,
  apiKey,
})

if (!argv['file']) {
  console.error('Please provide a file')
  process.exit(1)
}

const pwd = process.cwd()
const file = path.resolve(pwd, argv['file'])

const { messages } = toml.parse(fs.readFileSync(file, 'utf8'))

const response = await oai.chat.completions.create({
  model,
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
