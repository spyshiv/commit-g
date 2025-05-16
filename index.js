import { CommitGenerator } from "./lib/generator.js";
import { loadConfig } from "./lib/config.js";
import chalk from "chalk";

export async function main(argv = {}) {
  try {
    console.log(chalk.blue("\n🚀 Starting AI Commit Generator..."));

    // Load config and merge with command line arguments
    const config = {
      ...argv,
      ...(await loadConfig())
    };

    // Debug log to verify emoji flag is received
    console.log(chalk.gray(`⚙️  Configuration:`), {
      emoji: config.emoji,
      apiKey: config.apiKey ? "***" : "not set"
    });

    const generator = new CommitGenerator(config);
    await generator.run();
  } catch (error) {
    console.error(chalk.red("\n💥 Error:"), error.message);
    if (error.stack) {
      console.error(chalk.gray(error.stack));
    }
    process.exit(1);
  }
}

export { CommitGenerator };
export default main;
