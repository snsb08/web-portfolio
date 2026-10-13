import js from "@eslint/js";
import globals from "globals";

export default [
  { ignores: ["node_modules/", "coverage/"] },
  js.configs.recommended,
  {
    languageOptions: { globals: globals.browser },
    rules: {
      eqeqeq: "error",
      "no-var": "error",
      "prefer-const": "error",
    },
  },
  {
    // Config files run in Node, not the browser
    files: ["eslint.config.js"],
    languageOptions: { globals: globals.node },
  },
];
