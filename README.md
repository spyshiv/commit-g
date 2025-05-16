# AI Commit Message Generator

Generate meaningful Git commit messages using Google's Gemini AI.

## Installation

```bash
npm install -g commit-ai
```

## Usage

### CLI

```bash
commitg
```

### Configuration

You can configure the package in multiple ways:

1. **Environment variables**:

   ```bash
   export GEMINI_API_KEY='your-api-key'
   export GEMINI_MODEL='gemini-1.5-flash'
   ```

2. **Configuration file** (`.commitgrc.js` in your project):

   ```javascript
   module.exports = {
     apiKey: "your-api-key",
     model: "gemini-1.5-flash",
     maxDiffLength: 15000
   };
   ```

3. **Command-line arguments**:
   ```bash
   commitg --api-key your-key --model gemini-1.5-pro
   ```

## How It Works

1. Stages your Git changes (`git diff --cached`)
2. Sends the diff to Gemini AI
3. Generates a conventional commit message
4. Lets you edit/accept/regenerate the message
5. Creates the commit

## Requirements

- Node.js 16+
- Git repository
- Google Gemini API key
