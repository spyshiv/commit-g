# Commit-G 🤖✨

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://badge.fury.io/js/commit-g.svg)](https://www.npmjs.com/package/commit-g)

**AI-powered Git commit messages using Google's Gemini** - Never write a boring commit message again!

## Features 🌟

- ✨ **Smart Commit Messages**: Generates meaningful commit messages using Gemini AI
- 🚀 **Conventional Commits**: Follows standard commit conventions
- 🔍 **Context-Aware**: Analyzes your actual code changes
- 💡 **Interactive UI**: Choose, edit, or regenerate messages
- ⚡ **Fast**: Gets you committing in seconds
- 🔧 **Configurable**: Tailor to your project's needs

## Installation 📦

```bash
npm install -g commit-g
```

or for local project use:

```bash
npm install --save-dev commit-g
```

## Usage 🛠️

1.  Stage your changes:

```bash
git add .
```

2.  Run Commit-G:

```bash
commitg
```

3.  Follow the interactive prompts to:

    - ✅ Accept the suggested message

    - ✏️ Edit the message

    - 🔄 Regenerate a new suggestion

    - ❌ Cancel the commit

## Configuration ⚙️

Commit-G can be configured via:

1.  **Environment variables**:

```bash
export GEMINI_API_KEY="your_api_key_here"
export COMMITG_MODEL="gemini-1.5-flash"
```

2.  **Configuration file** (`.commitgrc.json` in your project root):

```json
{
  "apiKey": "your_api_key_here",
  "model": "gemini-1.5-flash",
  "maxLength": 72,
  "maxDiffLength": 10000,
  "emoji": true
}
```

3.  **Command-line arguments**:

```bash
commitg --api-key your_key --model gemini-pro --emoji
```

## Advanced Options 🔧

| Option      | Description                     | Default            |
| ----------- | ------------------------------- | ------------------ |
| `--api-key` | Gemini API key                  | From env/config    |
| `--model`   | Gemini model to use             | "gemini-1.5-flash" |
| `--emoji`   | Enable/disable emoji in commits | false              |

## Programmatic Usage 🤖

```javascript
import { generateCommitMessage } from "commit-g";

const message = await generateCommitMessage({
  apiKey: "your_key",
  diff: "git diff output" // optional
});

console.log(message);
```

## FAQ ❓

**Q: How do I get a Gemini API key?**
A: Get it from [Google AI Studio](https://aistudio.google.com/)

**Q: Is my code sent to Google's servers?**
A: Yes, the diff is sent to Gemini's API to generate the message

**Q: Can I use this in CI/CD pipelines?**
A: Yes! Set the `GEMINI_API_KEY` environment variable in your CI

## Contributing 🤝

PRs are welcome!

## License 📄

MIT © [Shiv Baran Singh](https://github.com/spyshiv)

---

Stop wasting time on commit messages - Let **Commit-G** do the heavy lifting!
