import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";
import chalk from "chalk";

export const DEFAULT_MODEL = "gemini-3.8-flash";

const CONFIG_KEYS = ["apiKey", "model", "maxDiffLength", "maxRetries", "emoji", "prefix"];

function filterUndefined(obj) {
  return Object.fromEntries(Object.entries(obj).filter(([, value]) => value !== undefined));
}

export function parseBoolean(value) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "on"].includes(normalized)) {
      return true;
    }
    if (["false", "0", "no", "off"].includes(normalized)) {
      return false;
    }
  }
  return undefined;
}

export function parseNumber(value, name) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  if (typeof value === "number" && Number.isInteger(value) && value >= 0) {
    return value;
  }
  if (typeof value === "string" && /^\d+$/.test(value.trim())) {
    return Number(value.trim());
  }
  if (name) {
    console.warn(chalk.yellow(`Ignoring invalid ${name}: ${value}`));
  }
  return undefined;
}

export function isRetiredModel(model) {
  return (
    model === "gemini-pro" ||
    model.startsWith("gemini-1.0") ||
    model.startsWith("gemini-1.5") ||
    model.startsWith("gemini-2.0")
  );
}

export function resolveModel(model) {
  if (!model || isRetiredModel(model)) {
    if (model && model !== DEFAULT_MODEL) {
      console.warn(
        chalk.yellow(`Model "${model}" is no longer available. Using ${DEFAULT_MODEL} instead.`)
      );
    }
    return DEFAULT_MODEL;
  }
  return model;
}

function configFromEnv(env) {
  return filterUndefined({
    apiKey: env.GEMINI_API_KEY || env.GOOGLE_API_KEY,
    model: env.GEMINI_MODEL || env.COMMITG_MODEL,
    maxDiffLength: parseNumber(env.MAX_DIFF_LENGTH, "MAX_DIFF_LENGTH"),
    maxRetries: parseNumber(env.MAX_RETRIES, "MAX_RETRIES"),
    emoji: parseBoolean(env.COMMITG_EMOJI),
    prefix: env.COMMITG_PREFIX,
  });
}

function configFromArgv(argv = {}) {
  return filterUndefined({
    apiKey: argv.apiKey,
    model: argv.model,
    maxDiffLength: parseNumber(argv.maxDiffLength, "maxDiffLength"),
    maxRetries: parseNumber(argv.maxRetries, "maxRetries"),
    emoji: parseBoolean(argv.emoji),
    prefix: typeof argv.prefix === "string" ? argv.prefix : undefined,
  });
}

function configFromFile(fileConfig = {}) {
  if (!fileConfig || typeof fileConfig !== "object" || Array.isArray(fileConfig)) {
    return {};
  }
  return filterUndefined({
    apiKey: fileConfig.apiKey,
    model: fileConfig.model,
    maxDiffLength: parseNumber(fileConfig.maxDiffLength, "maxDiffLength"),
    maxRetries: parseNumber(fileConfig.maxRetries, "maxRetries"),
    emoji: parseBoolean(fileConfig.emoji),
    prefix: typeof fileConfig.prefix === "string" ? fileConfig.prefix : undefined,
  });
}

export function buildConfig({ fileConfig = {}, env = {}, argv = {} } = {}) {
  const defaults = {
    model: DEFAULT_MODEL,
    maxDiffLength: 10000,
    maxRetries: 2,
    emoji: false,
  };
  const layers = [configFromArgv(argv), configFromEnv(env), configFromFile(fileConfig), defaults];
  const config = {};

  for (const key of CONFIG_KEYS) {
    for (const layer of layers) {
      if (layer[key] !== undefined) {
        config[key] = layer[key];
        break;
      }
    }
  }

  config.model = resolveModel(config.model);
  return config;
}

async function readConfigFile(configPath) {
  const extension = path.extname(configPath);
  if (extension === ".js") {
    const imported = await import(pathToFileURL(configPath).href);
    return imported.default ?? imported;
  }

  return JSON.parse(fs.readFileSync(configPath, "utf8"));
}

async function loadFileConfig(baseDir) {
  const configPaths = [
    path.join(baseDir, ".commitgrc"),
    path.join(baseDir, ".commitgrc.json"),
    path.join(baseDir, ".commitgrc.js"),
    path.join(baseDir, "commitg.config.js"),
  ];

  for (const configPath of configPaths) {
    if (!fs.existsSync(configPath)) {
      continue;
    }
    try {
      const config = await readConfigFile(configPath);
      if (config && typeof config === "object" && !Array.isArray(config)) {
        return config;
      }
      console.warn(
        chalk.yellow(`⚠️ Could not load ${path.basename(configPath)}: expected an object`)
      );
    } catch (error) {
      console.warn(
        chalk.yellow(`⚠️ Could not load ${path.basename(configPath)}: ${error.message}`)
      );
    }
  }

  return {};
}

export async function loadConfig(argv = {}, options = {}) {
  const baseDir = options.baseDir || process.cwd();
  const env = options.env || process.env;
  const fileConfig = await loadFileConfig(baseDir);
  const config = buildConfig({ fileConfig, env, argv });

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
