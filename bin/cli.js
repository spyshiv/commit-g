#!/usr/bin/env node

import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import chalk from "chalk";

// Parse command line arguments
const argv = yargs(hideBin(process.argv))
  .option("apiKey", {
    type: "string",
    description: "Gemini API key (overrides config)",
  })
  .option("emoji", {
    type: "boolean",
    description: "Include emojis in commit messages",
  })
  .option("maxDiffLength", {
    type: "number",
    description: "Max length of git diff to analyze",
  })
  .option("maxRetries", {
    type: "number",
    description: "Max number of retries for message generation",
  })
  .option("model", {
    type: "string",
    description: "Gemini model to use (e.g., gemini-1.5-flash)",
  })
  .option("prefix", {
    type: "string",
    description: "Add a prefix to the commit message (e.g., JIRA-123)",
  })
  .help().argv;

// Use dynamic import for better error handling
try {
  const { main } = await import("../index.js");
  await main(argv); // Pass argv to main function
} catch (error) {
  console.error(chalk.red("❌ Error:"), error.message);
  process.exit(1);
}
