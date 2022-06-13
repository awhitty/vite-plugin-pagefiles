const baseRules = {
  "prettier/prettier": "error",
  "simple-import-sort/imports": "error",
  "simple-import-sort/exports": "error",
  "no-undef": "off",
  "arrow-body-style": ["error", "as-needed"],
};

const rulesTypeScript = {
  ...baseRules,
};

const rulesJavaScript = { ...baseRules };

const ignorePatterns = [
  "*.min.*",
  "CHANGELOG.md",
  "dist",
  "LICENSE*",
  "output",
  "coverage",
  "public",
  "temp",
  "packages-lock.json",
  "pnpm-lock.yaml",
  "yarn.lock",
  "__snapshots__",
  "!.github",
  "!.vitepress",
  "!.vscode",
  "examples",
];

module.exports = {
  root: true,
  ignorePatterns,
  overrides: [
    {
      files: ["*.ts", "*.tsx"],
      parser: "@typescript-eslint/parser",
      parserOptions: {
        project: ["./tsconfig.json"],
      },
      rules: rulesTypeScript,
    },
  ],
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 12,
    sourceType: "module",
  },
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:jsx-a11y/recommended",
    "prettier",
  ],
  rules: rulesJavaScript,
  plugins: ["@typescript-eslint", "jsx-a11y", "prettier", "simple-import-sort"],
};
