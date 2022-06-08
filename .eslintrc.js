const baseRules = {
  "prettier/prettier": "error",
  "simple-import-sort/imports": "error",
  "simple-import-sort/exports": "error",
  "no-undef": "off",
  "arrow-body-style": ["error", "as-needed"],
  "react/prop-types": "off",
};

const rulesTypeScript = {
  ...baseRules,
};

const rulesJavaScript = { ...baseRules };

module.exports = {
  root: true,
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
    "plugin:react/recommended",
    "plugin:react/jsx-runtime",
    "plugin:react-hooks/recommended",
    "plugin:jsx-a11y/recommended",
    "prettier",
  ],
  rules: rulesJavaScript,
  plugins: [
    "@typescript-eslint",
    "react",
    "jsx-a11y",
    "prettier",
    "simple-import-sort",
  ],
  settings: {
    react: {
      version: "detect",
    },
  },
};
