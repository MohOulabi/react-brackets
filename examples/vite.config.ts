import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Serves every example from one dev server: `bun run examples`.
export default defineConfig({ plugins: [react(), tailwindcss()] });
