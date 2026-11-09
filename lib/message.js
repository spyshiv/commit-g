const TYPES = "feat|fix|docs|style|refactor|test|chore|perf|build|ci|revert";
const CONVENTIONAL_LINE = new RegExp(`^(?:${TYPES})(?:\\([^)\\n]+\\))?!?: \\S.*$`);

export function isConventionalCommit(message) {
  if (typeof message !== "string") {
    return false;
  }
  const firstLine = message.split(/\r?\n/, 1)[0].trim();
  return CONVENTIONAL_LINE.test(firstLine);
}

export function sanitizeCommitMessage(raw) {
  let text = String(raw ?? "")
    .replace(/^\uFEFF/, "")
    .replace(/\r\n/g, "\n")
    .trim();

  const fenced = text.match(/^```[a-zA-Z0-9_-]*\n([\s\S]*?)\n```$/);
  if (fenced) {
    text = fenced[1].trim();
  } else {
    text = text
      .replace(/^```[a-zA-Z0-9_-]*\n?/, "")
      .replace(/\n```$/, "")
      .trim();
  }

  text = text.replace(/^(?:commit message|your commit message)\s*:?\s*/i, "").trim();

  if (
    text.length > 1 &&
    ((text.startsWith('"') && text.endsWith('"')) || (text.startsWith("'") && text.endsWith("'")))
  ) {
    text = text.slice(1, -1).trim();
  }

  const lines = text.split("\n");
  const start = lines.findIndex((line) => CONVENTIONAL_LINE.test(line.trim()));
  if (start > 0) {
    text = lines.slice(start).join("\n").trim();
  }

  return text;
}

export function applyPrefix(message, prefix) {
  const clean = typeof prefix === "string" ? prefix.trim() : "";
  if (!clean) {
    return message;
  }
  return `${clean} ${message}`;
}
