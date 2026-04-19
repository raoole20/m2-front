module.exports = {
  env: {
    es2022: true,
    node: true,
    browser: true,
  },
  extends: ["eslint:recommended"],
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  ignorePatterns: ["**/.turbo/**", "**/dist/**", "**/node_modules/**"],
};
