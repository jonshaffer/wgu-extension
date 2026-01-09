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
    "max-len": ["error", {"code": 150}],
    "valid-jsdoc": "warn", // Defer full JSDoc compliance
    "@typescript-eslint/no-explicit-any": "warn", // Relaxed for now
  },
};
