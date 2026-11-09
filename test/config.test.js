import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { buildConfig, DEFAULT_MODEL, loadConfig } from "../lib/config.js";

test("cli overrides env, file, and defaults", () => {
  const config = buildConfig({
    fileConfig: { apiKey: "file", model: "gemini-3.5-flash-lite", emoji: true, maxDiffLength: 50 },
    env: {
      GEMINI_API_KEY: "env",
      GEMINI_MODEL: "gemini-3.6-flash",
      COMMITG_EMOJI: "false",
      MAX_DIFF_LENGTH: "80",
    },
    argv: { apiKey: "cli", emoji: true, model: "gemini-3.8-flash" },
  });

  assert.deepEqual(config, {
    apiKey: "cli",
    model: "gemini-3.8-flash",
    maxDiffLength: 80,
    maxRetries: 2,
    emoji: true,
  });
});

test("reads COMMITG_MODEL and GOOGLE_API_KEY when the Gemini names are unset", () => {
  const config = buildConfig({
    env: { GOOGLE_API_KEY: "google", COMMITG_MODEL: "gemini-3.5-flash-lite" },
  });
  assert.equal(config.apiKey, "google");
  assert.equal(config.model, "gemini-3.5-flash-lite");
});

test("replaces a retired model with the current default", () => {
  const warnings = [];
  const original = console.warn;
  console.warn = (message) => warnings.push(String(message));
  try {
    const config = buildConfig({
      fileConfig: { apiKey: "key", model: "gemini-1.5-flash" },
    });
    assert.equal(config.model, DEFAULT_MODEL);
    assert.match(warnings.join("\n"), /gemini-1\.5-flash/);
  } finally {
    console.warn = original;
  }
});

test("ignores invalid numeric settings", () => {
  const config = buildConfig({
    env: { GEMINI_API_KEY: "key", MAX_DIFF_LENGTH: "lots", MAX_RETRIES: "0" },
  });
  assert.equal(config.maxDiffLength, 10000);
  assert.equal(config.maxRetries, 0);
});

test("loads the first config file and requires an api key", async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "commit-g-config-"));
  fs.writeFileSync(path.join(directory, ".commitgrc"), JSON.stringify({ apiKey: "from-rc" }));
  fs.writeFileSync(
    path.join(directory, ".commitgrc.json"),
    JSON.stringify({ apiKey: "from-json", prefix: "TEAM" })
  );

  const config = await loadConfig({}, { baseDir: directory, env: {} });
  assert.equal(config.apiKey, "from-rc");
  assert.equal(config.prefix, undefined);

  await assert.rejects(() => loadConfig({}, { baseDir: os.tmpdir(), env: {} }), /No API key/);
});

test("loads a commonjs config file", async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "commit-g-cjs-"));
  fs.writeFileSync(
    path.join(directory, "commitg.config.js"),
    "module.exports = { apiKey: 'from-cjs', emoji: false };\n"
  );

  const config = await loadConfig({}, { baseDir: directory, env: {} });
  assert.equal(config.apiKey, "from-cjs");
  assert.equal(config.emoji, false);
});

test("loads an es module config file", async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "commit-g-esm-"));
  fs.writeFileSync(path.join(directory, "package.json"), JSON.stringify({ type: "module" }));
  fs.writeFileSync(
    path.join(directory, ".commitgrc.js"),
    "export default { apiKey: 'from-esm', maxRetries: 4 };\n"
  );

  const config = await loadConfig({}, { baseDir: directory, env: {} });
  assert.equal(config.apiKey, "from-esm");
  assert.equal(config.maxRetries, 4);
});
