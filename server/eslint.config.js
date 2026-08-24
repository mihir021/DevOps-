const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
        ...globals.jest, // describe/it/expect etc. used in tests/
      },
    },
  },
  {
    ignores: ['node_modules/**', 'coverage/**'],
  },
];
