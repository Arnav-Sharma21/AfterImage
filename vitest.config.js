import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['server/tests/**/*.test.js', 'tests/unit/**/*.test.js'],
    environment: 'node',
    fileParallelism: false,
    hookTimeout: 180000,
    testTimeout: 15000
  }
});
