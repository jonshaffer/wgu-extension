module.exports = {
  extends: "../../.eslintrc.cjs",
  rules: {
    // Relax rules for tests
    "max-len": ["error", { "code": 120 }], // Allow longer lines in tests
    "require-jsdoc": "off", // JSDoc not required for tests
    "@typescript-eslint/no-explicit-any": "warn", // Allow any but warn in tests
  },
};