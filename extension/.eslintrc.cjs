const baseConfig = require("../eslint.base.js");

module.exports = {
  ...baseConfig,
  env: {
    ...baseConfig.env,
    browser: true,
    webextensions: true,
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
    "/dist/**/*",
    "/.output/**/*",
    "/.wxt/**/*",
    "/node_modules/**/*",
    "*.config.ts",
    "*.config.js",
    ".eslintrc.cjs",
  ],
  rules: {
    ...baseConfig.rules,
    "max-len": ["error", {"code": 120}], // Longer lines for JSX
    "react/react-in-jsx-scope": "off", // Not needed in React 17+
    "react/prop-types": "off", // Using TypeScript for props
    "new-cap": "off", // React components are PascalCase
  },
};
