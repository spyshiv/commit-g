import { readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import chalk from "chalk";
import { createRequire } from "module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

export async function loadConfig() {
  const defaultConfig = {
    apiKey: process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_MODEL || "gemini-1.5-flash",
    maxDiffLength: parseInt(process.env.MAX_DIFF_LENGTH) || 10000,
    maxRetries: parseInt(process.env.MAX_RETRIES) || 2
  };

  const configPaths = [
    path.join(process.cwd(), ".commitgrc"),
    path.join(process.cwd(), ".commitgrc.json"),
    path.join(process.cwd(), ".commitgrc.js"),
    path.join(process.cwd(), "commitg.config.js"),
    path.join(__dirname, "../config/default.js")
  ];

  for (const configPath of configPaths) {
    try {
      // First try to require the file (works for both .js and .json)
      const fileConfig = require(configPath);

      // Handle both module.exports and ES module default exports
      const config = fileConfig.default || fileConfig;

      if (config && typeof config === "object") {
        console.log(
          chalk.gray(`⚙️  Loaded config from ${path.basename(configPath)}`)
        );
        return { ...defaultConfig, ...config };
      }
    } catch (err) {
      if (err.code !== "MODULE_NOT_FOUND") {
        console.warn(
          chalk.yellow(
            `⚠️  Could not load ${path.basename(configPath)}: ${err.message}`
          )
        );
      }
    }
  }

  // Validate we have at least an API key
  if (!defaultConfig.apiKey) {
    throw new Error(
      "No API key provided. Please set GEMINI_API_KEY environment variable " +
        "or create a configuration file (.commitgrc, .commitgrc.json, or .commitgrc.js)"
    );
  }

  return defaultConfig;
}
