import fs from "fs";
import os from "os";
import path from "path";
import prompts from "prompts";
import chalk from "chalk";
import boxen from "boxen";
import wrap from "wrap-ansi";
import { GoogleGenAI } from "@google/genai";
import { promptText } from "./prompt.js";
import { runCommand } from "./git.js";
import { applyPrefix, isConventionalCommit, sanitizeCommitMessage } from "./message.js";
import { DEFAULT_MODEL, resolveModel } from "./config.js";

export class CommitGenerator {
  constructor(config, options = {}) {
    this.validateConfig(config);
    this.config = {
      ...config,
      model: resolveModel(config.model || DEFAULT_MODEL),
      maxDiffLength: config.maxDiffLength ?? 10000,
      maxRetries: config.maxRetries ?? 2,
      emoji: Boolean(config.emoji),
    };
    this.cwd = options.cwd || process.cwd();
    this.ai = null;
  }

  get client() {
    if (!this.ai) {
      this.ai = new GoogleGenAI({ apiKey: this.config.apiKey });
    }
    return this.ai;
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
      const { stdout, stderr } = await runCommand("git", ["diff", "--cached"], { cwd: this.cwd });
      if (stderr.trim()) {
        console.warn(chalk.yellow(`Git warning: ${stderr.trim()}`));
      }
      return stdout;
    } catch (error) {
      throw new Error(`Failed to get git diff: ${error.stderr || error.message}`);
    }
  }

  async getDiffSummary() {
    try {
      const { stdout } = await runCommand("git", ["diff", "--cached", "--name-status"], {
        cwd: this.cwd,
      });
      return stdout;
    } catch (error) {
      console.warn(chalk.yellow(`Could not get diff summary: ${error.message}`));
      return "";
    }
  }

  async generateCommitMessage(diff, summary) {
    const prompt = promptText(summary, diff, this.config);
    const attempts = Math.max(1, Number(this.config.maxRetries) + 1);
    let lastMessage = "";
    let lastError;

    for (let attempt = 0; attempt < attempts; attempt++) {
      try {
        const response = await this.client.models.generateContent({
          model: this.config.model,
          contents: prompt,
        });
        const text = typeof response.text === "function" ? response.text() : response.text;
        const message = sanitizeCommitMessage(text);
        if (!message) {
          lastError = new Error("Model returned an empty commit message");
          continue;
        }
        lastMessage = message;
        if (isConventionalCommit(message)) {
          return applyPrefix(message, this.config.prefix);
        }
        lastError = new Error("Could not generate conventional commit format");
      } catch (error) {
        lastError = error;
      }
    }

    if (lastMessage) {
      console.warn(chalk.yellow("Could not generate conventional commit format"));
      return applyPrefix(lastMessage, this.config.prefix);
    }

    throw new Error(`Failed to generate message: ${lastError?.message || "unknown error"}`);
  }

  async createCommit(message) {
    const trimmed = typeof message === "string" ? message.trim() : "";
    if (!trimmed) {
      throw new Error("Commit message is empty");
    }

    const directory = fs.mkdtempSync(path.join(os.tmpdir(), "commit-g-"));
    const messageFile = path.join(directory, "COMMIT_EDITMSG");
    fs.writeFileSync(messageFile, `${trimmed}\n`, { encoding: "utf8", mode: 0o600 });

    try {
      const { stderr } = await runCommand("git", ["commit", "-F", messageFile], { cwd: this.cwd });
      if (stderr.trim()) {
        console.warn(chalk.yellow(stderr.trim()));
      }
      return true;
    } catch (error) {
      throw new Error(`Commit failed: ${error.stderr?.trim() || error.message}`);
    } finally {
      fs.rmSync(directory, { recursive: true, force: true });
    }
  }

  displayMessage(message) {
    const wrapped = wrap(message, 60);
    const box = boxen(wrapped, {
      padding: 1,
      margin: 1,
      borderStyle: "round",
      borderColor: "blue",
      backgroundColor: "#222222",
    });
    console.log(box);
  }

  async run() {
    try {
      await runCommand("git", ["rev-parse", "--is-inside-work-tree"], { cwd: this.cwd });
    } catch {
      throw new Error("Not in a Git repository");
    }

    let regenerating = false;
    while (true) {
      if (regenerating) {
        console.log(chalk.blue("\nRegenerating commit message...\n"));
      }

      const [diff, summary] = await Promise.all([this.getGitDiff(), this.getDiffSummary()]);

      if (!diff.trim()) {
        console.log(chalk.yellow("No staged changes found."));
        console.log(`Use ${chalk.cyan("git add")} to stage changes first.`);
        return;
      }

      const message = await this.generateCommitMessage(diff, summary);
      this.displayMessage(message);

      const response = await prompts([
        {
          type: "select",
          name: "action",
          message: "What would you like to do?",
          choices: [
            { title: "✅ Commit with this message", value: "commit" },
            { title: "✏️  Edit the message", value: "edit" },
            { title: "🔄 Regenerate the message", value: "regenerate" },
            { title: "❌ Cancel", value: "cancel" },
          ],
          initial: 0,
        },
        {
          type: (prev) => (prev === "edit" ? "text" : null),
          name: "editedMessage",
          message: "Edit your commit message:\n(Press Tab to edit, or start typing to replace)",
          initial: message,
        },
      ]);

      switch (response.action) {
        case "commit":
          await this.createCommit(message);
          console.log(chalk.green("\n✓ Commit created!"));
          return;
        case "edit": {
          const edited = response.editedMessage?.trim();
          if (!edited) {
            console.log(chalk.yellow("\nCommit cancelled."));
            return;
          }
          await this.createCommit(edited);
          console.log(chalk.green("\n✓ Commit created with edited message!"));
          return;
        }
        case "regenerate":
          regenerating = true;
          break;
        default:
          console.log(chalk.yellow("\nCommit cancelled."));
          return;
      }
    }
  }
}
