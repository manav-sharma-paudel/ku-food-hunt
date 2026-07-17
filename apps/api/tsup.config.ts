import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node20',
  sourcemap: true,
  clean: true,
  // Internal workspace package ships TS source, so it must be bundled in.
  noExternal: ['@ku-food-hunt/shared'],
});
