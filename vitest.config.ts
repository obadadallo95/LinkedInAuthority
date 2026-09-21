import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    globals: true,
    // Route tests intentionally exercise process-level secret guards and
    // server mocks. Serial file execution keeps those test-only env changes
    // from racing across workers and makes CI results deterministic.
    fileParallelism: false,
    exclude: ['test/browser/**', 'test/rules/**', 'node_modules/**', 'dist/**'],
  },
});
