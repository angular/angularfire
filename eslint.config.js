const tsParser = require('@typescript-eslint/parser');
const js = require('@eslint/js');
const globals = require('globals');
const ts = require('@typescript-eslint/eslint-plugin');
const ng = require('@angular-eslint/eslint-plugin');
const esImport = require('eslint-plugin-import');

module.exports = [
  {
    files: ['**/*.ts'],
    plugins: {
      '@typescript-eslint': ts,
      '@angular-eslint': ng,
      import: esImport,
    },
    languageOptions: {
      parser: tsParser,
      globals: {
        ...globals.browser,
      },
      parserOptions: {
        project: ['tsconfig.build.json', 'tsconfig.json', 'tsconfig.spec.json'],
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      ...ts.configs['recommended-requiring-type-checking'].rules,
      ...ts.configs['stylistic-type-checked'].rules,
      ...ng.configs.recommended.rules,
      ...esImport.configs.errors.rules,
      // eslint/js rules
      'no-undef': 'off',
      'no-redeclare': 'off',
      'prefer-arrow-callback': 'error',
      'curly': 'error',
      'no-dupe-class-members': 'off',
      "no-restricted-imports": ["error", "rxjs/Rx"],
      "no-console": ["error", {allow: ['log', 'error', 'warn']}],
      'sort-imports': [
        'error',
        {
          ignoreDeclarationSort: true,
        },
      ],
      // @typescript-eslint rules
      '@typescript-eslint/prefer-nullish-coalescing': 'off', // require `strictNullChecks`
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-declaration-merging': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-unnecessary-type-assertion': 'off',
      '@typescript-eslint/no-redundant-type-constituents': 'off', // causing pipeline error in src/compat/firestore/utils.spec.ts
      '@typescript-eslint/no-non-null-assertion': 'error',
      "@typescript-eslint/member-ordering": ["error", {
        "default": [
          "static-field",
          "instance-field",
          "static-method",
          "instance-method"
        ]
      }],
      '@typescript-eslint/no-unused-vars': [
        'error', {args: "after-used", "argsIgnorePattern": "^_"}
      ],
      // @angular-eslint rules
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'app',
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'app',
          style: 'kebab-case',
        },
      ],
      // import rules
      'import/no-unresolved': 'off',
      'import/namespace': 'off',
      'import/default': 'off',
      'import/export': 'off',
      'import/newline-after-import': 'error',
      'import/order': [
        'error',
        {
          alphabetize: {order: 'asc'},
          "newlines-between": "never"
        },
      ],
    },
  },
  {
    files: ['**/*.spec.ts'],
    languageOptions: {
      globals: {
        ...globals.jasmine,
      },
    },
  },
];
