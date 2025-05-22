import path from "path";
import { createRequire } from "module";
import chalk from "chalk";

// Create a require function for loading CommonJS modules in ESM context
const require = createRequire(import.meta.url);

// Utility to remove keys with undefined values from an object
function filterUndefined(obj) {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));
}

// Main function to load configuration from various sources
export async function loadConfig(argv) {
  // Default configuration values
  const defaultConfig = {
    apiKey: undefined,
    model: "gemini-1.5-flash",
    maxDiffLength: 10000,
    maxRetries: 2,
    emoji: false,
    prefix: undefined,
  };

  // Possible config file paths (checked in order)
  const configPaths = [
    path.join(process.cwd(), ".commitgrc"),
    path.join(process.cwd(), ".commitgrc.json"),
    path.join(process.cwd(), ".commitgrc.js"),
    path.join(process.cwd(), "commitg.config.js"),
  ];

  // Helper to load config from the first available file, returns undefined if no config is found
  const loadFileConfig = async (configPaths) => {
    for (const configPath of configPaths) {
      try {
        const config = require(configPath);
        if (config && typeof config === "object") {
          return config; // Return config if found and valid
        }
      } catch (err) {
        // Ignore file-not-found, warn for other errors
        if (err.code !== "MODULE_NOT_FOUND") {
          console.warn(
            chalk.yellow(`⚠️ Could not load ${path.basename(configPath)}: ${err.message}`)
          );
        }
      }
    }
  };

  const fileConfig = await loadFileConfig(configPaths);

  // Load config from environment variables
  const envConfig = {
    apiKey: process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_MODEL,
    maxDiffLength: process.env.MAX_DIFF_LENGTH && parseInt(process.env.MAX_DIFF_LENGTH),
    maxRetries: process.env.MAX_RETRIES && parseInt(process.env.MAX_RETRIES),
    emoji: process.env.COMMITG_EMOJI === "true" ? true : undefined,
    prefix: process.env.COMMITG_PREFIX,
  };

  // Filter out special keys from argv (like _ and $0)
  const filteredArgv = Object.fromEntries(
    Object.entries(argv).filter(([key]) => key !== "_" && key !== "$0")
  );

  // Merge configs: default < file < env < argv (last wins)
  const config = Object.assign(
    {},
    filterUndefined(defaultConfig),
    filterUndefined(fileConfig || {}), // if fileConfig is undefined, use an empty object
    filterUndefined(envConfig),
    filterUndefined(filteredArgv)
  );

  // Require API key to be set, otherwise throw error with instructions
  if (!config.apiKey) {
    throw new Error(
      "No API key provided. Please provide your Gemini API key in one of the following ways:\n" +
        "  • Set the GEMINI_API_KEY environment variable\n" +
        "  • Use the --apiKey command-line flag\n" +
        "  • Add 'apiKey' to your .commitgrc, .commitgrc.json, .commitgrc.js, or commitg.config.js config file"
    );
  }

  return config;
}
