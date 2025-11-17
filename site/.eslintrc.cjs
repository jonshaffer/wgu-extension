const baseConfig = require("../eslint.base.js");

module.exports = {
  ...baseConfig,
  env: {
    ...baseConfig.env,
    browser: true,
  },
  extends: [
    ...baseConfig.extends,
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
  ],
  plugins: [
    ...baseConfig.plugins,
    "react",
    "react-hooks",
  ],
  settings: {
    react: {
      version: "detect",
    },
  },
  parserOptions: {
    ...baseConfig.parserOptions,
    ecmaFeatures: {
      jsx: true,
    },
  },
  ignorePatterns: [
    "/build/**/*",
    "/dist/**/*",
    "/.react-router/**/*",
    "/node_modules/**/*",
    "*.config.ts",
    "*.config.js",
    ".eslintrc.cjs",
  ],
  rules: {
    ...baseConfig.rules,
    "max-len": ["error", {"code": 120}],
    "react/react-in-jsx-scope": "off",
    "react/prop-types": "off",
    "new-cap": "off",
  },
};
