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
    "valid-jsdoc": "warn", // Defer full JSDoc compliance
    "react/react-in-jsx-scope": "off", // Not needed in React 17+
    "react/prop-types": "off", // Using TypeScript for props
    "new-cap": "off", // React components are PascalCase
  },
  overrides: [
    {
      // Component files with JSX (general rule, applied first)
      files: ["components/**/*.tsx"],
      rules: {
        "max-len": ["error", {"code": 150}],
      },
    },
    {
      // UI components use long Tailwind class strings (more specific, overrides above)
      files: ["components/ui/**/*.tsx"],
      rules: {
        "max-len": "off", // Tailwind classes can be very long
      },
    },
    {
      // Scripts, utilities, and entrypoints may have long strings/paths
      files: ["scripts/**/*.ts", "utils/**/*.ts", "entrypoints/**/*.ts", "entrypoints/**/*.tsx"],
      rules: {
        "max-len": ["error", {"code": 200, "ignoreStrings": true}],
      },
    },
    {
      // Files with embedded SVG icons need longer lines (most specific)
      files: [
        "utils/communities-panel.ts",
        "components/course-details/CommunitiesPanel.tsx",
        "components/course-details/SearchPanel.tsx",
      ],
      rules: {
        "max-len": ["error", {"code": 1500, "ignoreStrings": true}],
      },
    },
  ],
};
