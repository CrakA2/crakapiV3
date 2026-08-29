import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [svelte()],
  resolve: {
    alias: {
      $lib: fileURLToPath(new URL('./src/lib', import.meta.url)),
      '$app/environment': fileURLToPath(
        new URL('./vitest/app-environment.ts', import.meta.url)
      ),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{ts,js,svelte}'],
    setupFiles: ['./vitest/setup.ts'],
    environmentMatchGlobs: [
      ['**/src/lib/server/**', 'node'],
      ['**/*.server.test.ts', 'node'],
    ],
  },
});
