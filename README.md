# oai-cli

Simple & opinional completion CLI for OpenAI-Compatibility API. The purpose is I want to test local LLM output in very simple way.

## Installation

```bash
npm install -g oai-cli
```

## Usage

Config file is `~/.oai-cli.toml`:

```toml
baseURL = "http://localhost:1234/v1" # e.g. Local Server by LM Studio
defaultModel = "gemma-2-27b-it"
```

Flags

- `-f, --file`: TOML file for prompt
- `-o, --output`: Output file
- `-e, --endpoint`: Endpoint
- `-m, --model`: Model name
- `-t, --temperature`: Temperature

## Example

Create a file as input, use TOML:

```toml
[[messages]]
role = "system"
content = """
Always answer in rhymes. Today is Thursday
"""

[[messages]]
role = "user"
content = "What day is it today?"
```

Run:

```bash
oai -f ./input.toml -o ./output.toml
```

Result:

```
> oai -f ./input.toml -o ./output.toml
The week is almost done, you see,
It's Thursday, happy as can be!
```

Then output is saved as `output.toml` (default to `{file}.out`):

```toml
[[messages]]
role = "system"
content = """
Always answer in rhymes. Today is Thursday
"""

[[messages]]
role = "user"
content = "What day is it today?"

[[messages]]
role = "assistant"
content = """
The week is almost done, you see,
It's Thursday, happy as can be!
"""
```

## License

MIT
