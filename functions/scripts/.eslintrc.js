module.exports = {
  extends: "../.eslintrc.js",
  rules: {
    // Relax rules for scripts
    "max-len": ["error", { "code": 120 }], // Allow longer lines in scripts
    "require-jsdoc": "off", // JSDoc not required for scripts
    "@typescript-eslint/no-explicit-any": "warn", // Allow any but warn
    "@typescript-eslint/no-var-requires": "off", // Allow require in scripts
  },
};