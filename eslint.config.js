import { defineConfig } from "eslint/config";
import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import globals from "globals";

export default defineConfig([
  {
    files: ["**/*.js"],
    plugins: { js },
    extends: [js.configs.recommended, prettier],
    languageOptions: {
      globals: globals.node,
      ecmaVersion: 2022,
      sourceType: "module",
    },
    rules: {
      "no-console": "off",
      "no-process-exit": "off",
      "no-var": "error",
      "prefer-const": "error",
      eqeqeq: ["error", "always"],
      curly: "error",
      semi: ["error", "always"],
      "no-unused-vars": "warn",
      "no-undef": "warn",
    },
  },
]);
