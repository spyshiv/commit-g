# Configuration ⚙️

You can configure Commit-G in three ways:

## 1. Environment Variables

```bash
export GEMINI_API_KEY="your_key"
export COMMITG_MODEL="gemini-1.5-flash"
```

## 2. .commitgrc.json File

```json
{
  "apiKey": "your_key",
  "model": "gemini-1.5-flash",
  "maxDiffLength": 10000,
  "emoji": true,
  "prefix": "JIRA-123"
}
```

## 3. Command-Line Flags

```bash
commitg --api-key your_key --model gemini-pro --emoji --prefix JIRA-123
```
