import { spawn } from "child_process";

const DEFAULT_MAX_BUFFER = 20 * 1024 * 1024;

export function runCommand(command, args, { cwd, input, maxBuffer = DEFAULT_MAX_BUFFER } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      shell: false,
      windowsHide: true,
      stdio: ["pipe", "pipe", "pipe"],
    });

    const stdoutChunks = [];
    const stderrChunks = [];
    let stdoutLen = 0;
    let stderrLen = 0;
    let overflow = false;

    const take = (chunks, chunk, current) => {
      const next = current + chunk.length;
      if (next > maxBuffer) {
        overflow = true;
        child.kill();
        return current;
      }
      chunks.push(chunk);
      return next;
    };

    child.stdout.on("data", (chunk) => {
      stdoutLen = take(stdoutChunks, chunk, stdoutLen);
    });
    child.stderr.on("data", (chunk) => {
      stderrLen = take(stderrChunks, chunk, stderrLen);
    });

    child.on("error", reject);
    child.on("close", (code) => {
      const stdout = Buffer.concat(stdoutChunks).toString("utf8");
      const stderr = Buffer.concat(stderrChunks).toString("utf8");
      if (overflow) {
        const error = new Error(`${command} output exceeded ${maxBuffer} bytes`);
        error.stdout = stdout;
        error.stderr = stderr;
        reject(error);
        return;
      }
      if (code !== 0) {
        const error = new Error(
          stderr.trim() || stdout.trim() || `${command} exited with code ${code}`
        );
        error.stdout = stdout;
        error.stderr = stderr;
        error.code = code;
        reject(error);
        return;
      }
      resolve({ stdout, stderr });
    });

    if (input !== undefined && input !== null) {
      child.stdin.end(input);
    } else {
      child.stdin.end();
    }
  });
}
