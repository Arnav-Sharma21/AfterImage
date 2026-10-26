import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default [
  { ignores: ['**/node_modules/**', '**/dist/**', 'coverage/**', '.agents/**', 'test-results/**', 'playwright-report/**'] },
  js.configs.recommended,
  { files: ['**/*.js', '**/*.jsx'], languageOptions: { ecmaVersion: 'latest', sourceType: 'module', globals: globals.node, parserOptions: { ecmaFeatures: { jsx: true } } }, rules: { 'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }] } },
  { files: ['tests/e2e/**/*.spec.js', 'server/scripts/*.js'], languageOptions: { globals: globals.browser } },
  {
    files: ['client/src/**/*.{js,jsx}'],
    languageOptions: { globals: globals.browser },
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: { ...reactHooks.configs.recommended.rules, 'react-refresh/only-export-components': ['warn', { allowConstantExport: true }], 'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^_' }] }
  }
];
