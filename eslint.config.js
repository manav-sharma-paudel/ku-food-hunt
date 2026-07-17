import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['**/dist/**', '**/node_modules/**', '**/coverage/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    files: ['apps/web/src/**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
  {
    // Files that intentionally co-locate primitives, variant helpers, hooks, or lazy
    // route imports with components — a full reload on edit is fine for these.
    files: [
      'apps/web/src/router.tsx',
      'apps/web/src/lib/theme.tsx',
      'apps/web/src/components/ui/**/*.tsx',
      'apps/web/src/components/restaurant/ImageLightbox.tsx',
      'apps/web/src/components/search/SearchProvider.tsx',
      'apps/web/src/admin/AdminAuthContext.tsx',
      'apps/web/src/admin/pages/AdminRestaurantEditor.tsx',
    ],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
  prettier,
);
