import chalk from "chalk";

const promptText = (summary, diff, config) => {
  const emojiMapping = {
    feat: "✨", // New feature
    fix: "🐛", // Bug fix
    docs: "📝", // Documentation
    style: "🎨", // Code style improvements
    refactor: "♻️", // Code refactoring
    test: "✅", // Testing
    chore: "🔧", // Maintenance tasks
    perf: "⚡", // Performance improvements
    build: "📦", // Build system changes
    ci: "👷", // CI/CD changes
    revert: "⏪", // Revert changes
  };

  const truncateDiff = (diff) => {
    if (diff.length > config.maxDiffLength) {
      console.warn(chalk.yellow("Diff truncated for API request"));
      return diff.substring(0, config.maxDiffLength) + "\n... [truncated]";
    }
    return diff;
  };

  const emojiRules = config.emoji
    ? `
4. EMOJI RULES (REQUIRED WHEN ENABLED):
   - Place one emoji immediately after the type
   - Use these exact mappings:
   ${Object.entries(emojiMapping)
     .map(([type, emoji]) => `${type.padEnd(8)}→ ${emoji}`)
     .join("\n     ")}`
    : "";

  const prompt = `Generate EXACTLY ONE professional, conventional commit message for these changes.
If changes span multiple types, create MULTIPLE LINES (one per type).

CHANGES:
${summary}

CODE DIFF:
\`\`\`diff
${truncateDiff(diff)}
\`\`\`

STRICT FORMATTING RULES:
1. STRUCTURE: <type>(<scope>):${config.emoji ? " <emoji>" : ""} <subject>
2. CONTENT:
   - Subject: 50-72 chars, imperative mood ("Add" not "Added")
   - Be specific about what changed
   - Reference components/modules when possible
3. TYPES (use most specific applicable):
   feat     → New feature
   fix      → Bug fix
   docs     → Documentation
   style    → Code style/formatting
   refactor → Code restructuring
   test     → Testing related
   chore    → Maintenance tasks
   perf     → Performance improvements
   build    → Build system
   ci       → CI/CD pipelines
   revert   → Reverted changes
${emojiRules}
5. OUTPUT REQUIREMENTS:
   - ONLY the commit message(s)
   - NO explanations or commentary
   - If multiple types: ONE LINE PER TYPE
   - The first line must follow the STRUCTURE rule exactly.
   - Subsequent lines (line 2 onwards) must be indented with exactly 4 spaces and start with an asterisk and a space (\`    * \`) before the STRUCTURE.
   - MAX 150 characters per line.

EXAMPLES:
${
  config.emoji
    ? `feat(auth): ✨ Implement password strength meter
fix(server): 🐛 Resolve session timeout issue
docs(readme): 📝 Add API endpoint documentation

Example multi-line (hypothetical):
feat(api): Add new user endpoint
    * docs(api): Update API documentation for /users
    * test(api): Add unit tests for new user endpoint`
    : `feat(auth): Implement password strength meter
fix(server): Resolve session timeout issue
docs(readme): Add API endpoint documentation

Example multi-line (hypothetical):
feat(api): Add new user endpoint
    * docs(api): Update API documentation for /users
    * test(api): Add unit tests for new user endpoint`
}

YOUR COMMIT MESSAGE:`;
  return prompt;
};

export { promptText };
