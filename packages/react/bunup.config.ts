import { defineConfig } from 'bunup';

export default defineConfig({
  entry: 'src/index.ts',
  format: ['esm', 'cjs'],
  external: ['react', 'react-dom', '@react-brackets/core'],
  banner: "'use client';",
});
