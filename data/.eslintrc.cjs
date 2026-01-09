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
  rules: {
    ...baseConfig.rules,
    "max-len": ["error", {"code": 120}],
    "valid-jsdoc": "warn",
  },
  overrides: [
    {
      // Parser files contain complex regex patterns that legitimately need longer lines
      files: ["pipelines/catalog/parsers/**/*.ts"],
      rules: {
        "max-len": ["error", {"code": 500, "ignoreRegExpLiterals": true}],
      },
    },
    {
      // Scripts and analytics often have long template strings or paths
      files: ["scripts/**/*.ts", "pipelines/**/analytics/**/*.ts", "pipelines/**/validate.ts"],
      rules: {
        "max-len": ["error", {"code": 200}],
      },
    },
    {
      // Shared types may have long type definitions
      files: ["pipelines/_shared/**/*.ts"],
      rules: {
        "max-len": ["error", {"code": 150}],
      },
    },
  ],
};
