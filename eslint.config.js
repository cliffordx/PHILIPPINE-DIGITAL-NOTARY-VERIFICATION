const tsParser = require('@typescript-eslint/parser');

module.exports = [
  {
    ignores: ['dist/**', 'coverage/**', 'node_modules/**'],
  },
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
        sourceType: 'module',
      },
      globals: {
        console: 'readonly',
        describe: 'readonly',
        expect: 'readonly',
        it: 'readonly',
        module: 'readonly',
        process: 'readonly',
        require: 'readonly',
      },
    },
    rules: {},
  },
];