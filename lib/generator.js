import { exec } from "child_process";
import { promisify } from "util";
import { GoogleGenerativeAI } from "@google/generative-ai";
import prompts from "prompts";
import chalk from "chalk";
import boxen from "boxen";
import wrap from "wrap-ansi";

const execAsync = promisify(exec);

export class CommitGenerator {
  constructor(config) {
    this.validateConfig(config);
    this.ai = new GoogleGenerativeAI(config.apiKey);
    this.config = config;
  }

  validateConfig(config) {
    if (!config.apiKey) {
      throw new Error(
        "No API key provided. Please set GEMINI_API_KEY environment variable " +
          "or create a configuration file (.commitgrc, .commitgrc.json, or .commitgrc.js)"
      );
    }
  }

  async getGitDiff() {
    try {
      const { stdout, stderr } = await execAsync("git diff --cached");
      if (stderr) console.warn(chalk.yellow(`Git warning: ${stderr}`));
      return stdout;
    } catch (error) {
      throw new Error(
        `Failed to get git diff: ${error.stderr || error.message}`
      );
    }
  }

  async getDiffSummary() {
    try {
      const { stdout } = await execAsync("git diff --cached --name-status");
      return stdout;
    } catch (error) {
      console.warn(chalk.yellow("Could not get diff summary"));
      return "";
    }
  }

  truncateDiff(diff) {
    if (diff.length > this.config.maxDiffLength) {
      console.warn(chalk.yellow("Diff truncated for API request"));
      return diff.substring(0, this.config.maxDiffLength) + "\n... [truncated]";
    }
    return diff;
  }

  async generateCommitMessage(diff, summary, retries = 0) {
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
      revert: "⏪" // Revert changes
    };

    const emojiRules = this.config.emoji
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
${this.truncateDiff(diff)}
\`\`\`

STRICT FORMATTING RULES:
1. STRUCTURE: <type>(<scope>):${this.config.emoji ? " <emoji>" : ""} <subject>
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
   - MAX 150 characters per line

EXAMPLES:
${
  this.config.emoji
    ? `feat(auth): ✨ Implement password strength meter
fix(server): 🐛 Resolve session timeout issue
docs(readme): 📝 Add API endpoint documentation`
    : `feat(auth): Implement password strength meter
fix(server): Resolve session timeout issue
docs(readme): Add API endpoint documentation`
}

YOUR COMMIT MESSAGE:`;

    try {
      const model = this.ai.getGenerativeModel({ model: this.config.model });
      const result = await model.generateContent(prompt);
      const response = result.response;
      let message = response.text();

      // Clean up response
      message = message
        .replace(/^```/, "")
        .replace(/Commit Message:/i, "")
        .trim();

      // Validate format
      if (
        !/^(feat|fix|docs|style|refactor|test|chore|perf|build|ci|revert)(\(.+\))?: .+/.test(
          message
        )
      ) {
        if (retries < this.config.maxRetries) {
          return this.generateCommitMessage(diff, summary, retries + 1);
        }
        console.warn(
          chalk.yellow("Could not generate conventional commit format")
        );
      }

      return message;
    } catch (error) {
      if (retries < this.config.maxRetries) {
        return this.generateCommitMessage(diff, summary, retries + 1);
      }
      throw new Error(`Failed to generate message: ${error.message}`);
    }
  }

  async createCommit(message) {
    try {
      const escapedMessage = message.replace(/"/g, '\\"');
      const { stdout, stderr } = await execAsync(
        `git commit -m "${escapedMessage}"`
      );
      if (stderr) console.warn(chalk.yellow(stderr));
      return true;
    } catch (error) {
      throw new Error(`Commit failed: ${error.stderr || error.message}`);
    }
  }

  displayMessage(message) {
    const wrapped = wrap(message, 60);
    const box = boxen(wrapped, {
      padding: 1,
      margin: 1,
      borderStyle: "round",
      borderColor: "blue",
      backgroundColor: "#222222"
    });
    console.log(box);
  }

  async run() {
    console.log(chalk.blue("\n🤖 AI Commit Message Generator\n"));

    // Verify git repo
    try {
      await execAsync("git rev-parse --is-inside-work-tree");
    } catch {
      throw new Error("Not in a Git repository");
    }

    // Get changes
    const [diff, summary] = await Promise.all([
      this.getGitDiff(),
      this.getDiffSummary()
    ]);

    if (!diff.trim()) {
      console.log(chalk.yellow("No staged changes found."));
      console.log(`Use ${chalk.cyan("git add")} to stage changes first.`);
      return;
    }

    // Generate message
    const message = await this.generateCommitMessage(diff, summary);
    this.displayMessage(message);

    // User interaction
    const response = await prompts([
      {
        type: "select",
        name: "action",
        message: "What would you like to do?",
        choices: [
          { title: "✅ Commit with this message", value: "commit" },
          { title: "✏️  Edit message", value: "edit" },
          { title: "🔄 Regenerate message", value: "regenerate" },
          { title: "❌ Cancel", value: "cancel" }
        ],
        initial: 0
      },
      {
        type: (prev) => (prev === "edit" ? "text" : null),
        name: "editedMessage",
        message: "Edit your commit message:",
        initial: message
      }
    ]);

    // Handle action
    switch (response.action) {
      case "commit":
        await this.createCommit(message);
        console.log(chalk.green("\n✓ Commit created!"));
        break;
      case "edit":
        await this.createCommit(response.editedMessage);
        console.log(chalk.green("\n✓ Commit created with edited message!"));
        break;
      case "regenerate":
        return this.run(); // Start over
      default:
        console.log(chalk.yellow("\nCommit cancelled."));
    }
  }
}
