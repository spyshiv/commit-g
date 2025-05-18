# FAQ ❓

### How do I get a Gemini API key?

Get one from [Google AI Studio](https://aistudio.google.com/).

### Is my code sent to Google?

Yes, the code diff is sent to Gemini's API for generating commit messages.

### Can I use Commit-G in CI/CD?

Yes! Set `GEMINI_API_KEY` and any other desired config as environment variables in your pipeline.

### How do I add a JIRA ID?

Use `--prefix JIRA-123` in CLI or add `"prefix": "JIRA-123"` in `.commitgrc.json`.

### How do I enable emoji?

Use the `--emoji` flag or set `"emoji": true` in `.commitgrc.json`.

### Can I change the Gemini model?

Yes. Use the `--model` flag or update your config file.

---

👉 [Home](index.md)
