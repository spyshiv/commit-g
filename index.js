import { CommitGenerator } from "./lib/generator.js";
import { loadConfig } from "./lib/config.js";
import chalk from "chalk";

export async function main(argv = {}) {
  try {
    console.log(chalk.blue("\n🚀 Starting AI Commit Generator..."));

    const config = await loadConfig(argv);

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
