const baseConfig = require("../eslint.base.js");

module.exports = {
  ...baseConfig,
  parserOptions: {
    ...baseConfig.parserOptions,
    project: ["tsconfig.json", "tsconfig.dev.json"],
  },
  ignorePatterns: [
    "/lib/**/*", // Ignore built files.
    "/generated/**/*", // Ignore generated files.
    "/scripts/**/*", // Scripts have their own eslint config
    ".eslintrc.js", // Ignore eslint config files
  ],
};
