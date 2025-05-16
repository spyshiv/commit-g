#!/usr/bin/env node

import { createRequire } from "module";
const require = createRequire(import.meta.url);

// Use dynamic import for better error handling
try {
  const { main } = await import("../index.js");
  await main();
} catch (error) {
  console.error("❌ Error:", error.message);
  process.exit(1);
}
