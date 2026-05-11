import obsidianmd from 'eslint-plugin-obsidianmd';
import tsparser from '@typescript-eslint/parser';
import tseslint from '@typescript-eslint/eslint-plugin';
import json from '@eslint/json';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'coverage/**',
      'tests/**',
      'main.js',
      'styles.css',
      'release/**',
      'scripts/**',
      'esbuild.config.mjs',
      'jest.config.js',
    ],
  },
  ...obsidianmd.configs.recommendedWithLocalesEn,
  {
    files: ['manifest.json', 'package.json'],
    ignores: ['manifest.json'],
    language: 'json/json',
    plugins: {
      json,
    },
    rules: {
      'no-irregular-whitespace': 'off',
    },
  },
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        project: './tsconfig.obsidian-eslint.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      '@typescript-eslint/require-await': 'error',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
    },
  },
  {
    files: ['src/i18n/locales/en.json'],
    language: 'json/json',
    plugins: {
      json,
      obsidianmd,
    },
    rules: {
      'no-irregular-whitespace': 'off',
      'obsidianmd/ui/sentence-case-json': 'error',
    },
  },
]);
