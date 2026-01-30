// ESLint configuration for vanilla HTML & JavaScript project
export default [
  {
    ignores: ["node_modules", "frontend/src/assets/css/output.css", ".firebase", "dist", "build"],
  },
  {
    files: ["frontend/src/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        // Browser globals
        document: "readonly",
        window: "readonly",
        console: "readonly",
        fetch: "readonly",
        localStorage: "readonly",
        sessionStorage: "readonly",
        // Firebase globals
        firebase: "readonly",
        db: "readonly",
        auth: "readonly",
      },
    },
    rules: {
      "no-unused-vars": ["warn"],
      "no-console": "off",
    },
  },
];
