const baseConfig = require("../eslint.base.js");

module.exports = {
  ...baseConfig,
  ignorePatterns: [
    "/dist/**/*",
    "/node_modules/**/*",
    "*.config.ts",
    "*.config.js",
    ".eslintrc.cjs",
  ],
};
