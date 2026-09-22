// ESLint flat config. No package.json, no node_modules, no npm dependency in
// this repo (docs/constitution.md, Art. 1) — run with a globally installed
// eslint: `npm install -g eslint` once, then `eslint .` from the repo root.
export default [
  {
    files: ["js/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "script",
      globals: {
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
        fetch: "readonly",
        module: "writable",
        require: "readonly",
        console: "readonly",
      },
    },
    rules: {
      "no-unused-vars": "warn",
      "no-undef": "error",
      eqeqeq: "error",
      "no-var": "error",
      "prefer-const": "warn",
    },
  },
];
