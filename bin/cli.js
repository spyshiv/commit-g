#!/usr/bin/env node

import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import chalk from "chalk";

// Parse command line arguments
const argv = yargs(hideBin(process.argv))
  .option("emoji", {
    type: "boolean",
    default: false,
    description: "Include emojis in commit messages"
  })
  .option("api-key", {
    type: "string",
    description: "Gemini API key (overrides config)"
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
