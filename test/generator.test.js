import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { CommitGenerator } from "../lib/generator.js";
import { runCommand } from "../lib/git.js";

function generatorWith(text, config = {}) {
  const generator = new CommitGenerator({
    apiKey: "test-key",
    maxRetries: 1,
    emoji: false,
    ...config,
  });
  const replies = Array.isArray(text) ? [...text] : [text];
  generator.ai = {
    models: {
      generateContent: async () => ({ text: replies.shift() }),
    },
  };
  return generator;
}

test("uses the model text after cleanup and applies the prefix once", async () => {
  const generator = generatorWith("```text\nfeat(ui): Add commit preview\n```", {
    prefix: "JIRA-9",
    maxRetries: 0,
  });

  const message = await generator.generateCommitMessage("diff", "M file");
  assert.equal(message, "JIRA-9 feat(ui): Add commit preview");
});

test("retries until the reply is a conventional commit", async () => {
  const generator = generatorWith(["Sure, here you go", "fix(git): Preserve commit message text"], {
    maxRetries: 1,
  });

  const message = await generator.generateCommitMessage("diff", "M file");
  assert.equal(message, "fix(git): Preserve commit message text");
});

test("commits the message literally, including quotes and shell characters", async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "commit-g-repo-"));
  await runCommand("git", ["init", "-b", "main"], { cwd: directory });
  await runCommand("git", ["config", "user.email", "commit-g-test@example.com"], {
    cwd: directory,
  });
  await runCommand("git", ["config", "user.name", "Commit G Test"], { cwd: directory });
  await runCommand("git", ["config", "commit.gpgsign", "false"], { cwd: directory });

  fs.writeFileSync(path.join(directory, "note.txt"), "hello\n");
  await runCommand("git", ["add", "note.txt"], { cwd: directory });

  const message = 'fix(shell): Keep "quotes", `backticks`, and $(not-executed)\n\nBody line';
  const generator = new CommitGenerator({ apiKey: "test-key" }, { cwd: directory });
  await generator.createCommit(message);

  const { stdout } = await runCommand("git", ["log", "-1", "--format=%B"], { cwd: directory });
  assert.equal(stdout.trimEnd(), message);
});

test("refuses an empty commit message", async () => {
  const generator = new CommitGenerator({ apiKey: "test-key" });
  await assert.rejects(() => generator.createCommit("   "), /empty/);
});
