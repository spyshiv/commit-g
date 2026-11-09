import assert from "node:assert/strict";
import test from "node:test";
import { applyPrefix, isConventionalCommit, sanitizeCommitMessage } from "../lib/message.js";

test("strips a markdown fence and keeps a conventional message", () => {
  const message = sanitizeCommitMessage("```\nfeat(ui): Add commit preview\n```");
  assert.equal(message, "feat(ui): Add commit preview");
  assert.equal(isConventionalCommit(message), true);
});

test("extracts the commit from surrounding prose and wrapping quotes", () => {
  const message = sanitizeCommitMessage(
    "Sure, here is a commit message:\n\nfix(parser): Keep quotes and $(shell) text"
  );
  assert.equal(message, "fix(parser): Keep quotes and $(shell) text");
  assert.equal(
    sanitizeCommitMessage('"fix(parser): Keep quotes and $(shell) text"'),
    "fix(parser): Keep quotes and $(shell) text"
  );
});

test("keeps multi-line conventional bodies", () => {
  const raw = "feat(api): Add user endpoint\n    * docs(api): Document /users";
  assert.equal(sanitizeCommitMessage(raw), raw);
  assert.equal(isConventionalCommit(raw), true);
});

test("rejects a message that is not a conventional commit", () => {
  assert.equal(isConventionalCommit("Added a button"), false);
});

test("prepends a prefix once", () => {
  assert.equal(applyPrefix("feat(api): Add route", "JIRA-123"), "JIRA-123 feat(api): Add route");
  assert.equal(applyPrefix("feat(api): Add route", "  "), "feat(api): Add route");
});
