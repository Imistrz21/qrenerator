const globals = require("globals");
const pluginJs = require("@eslint/js");
const eslintPluginPrettierRecommended = require("eslint-plugin-prettier/recommended");

module.exports = [
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module", // Keep sourceType as module for script.js itself
      globals: {
        ...globals.browser,
        ...globals.node,
        "QRCode": "readonly",
        "App": "readonly"
      }
    }
  },
  pluginJs.configs.recommended,
  eslintPluginPrettierRecommended, // This might need adjustment for CJS
  {
    rules: {
      "prettier/prettier": "warn"
    }
  },
  {
    ignores: [
      "node_modules/",
      "dist/",
      "build/",
      "*.json",
      "*.md",
      "index.html",
      "style.css",
      "eslint.config.cjs"
    ]
  }
];
