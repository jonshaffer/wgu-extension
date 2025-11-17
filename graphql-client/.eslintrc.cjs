const baseConfig = require("../eslint.base.js");

module.exports = {
  ...baseConfig,
  ignorePatterns: [
    "/dist/**/*",
    "/lib/**/*",
    "/node_modules/**/*",
    "*.config.ts",
    "*.config.js",
    ".eslintrc.cjs",
  ],
  rules: {
    ...baseConfig.rules,
    "@typescript-eslint/no-explicit-any": "error", // Stricter for published package
  },
};
