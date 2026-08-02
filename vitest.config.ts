import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(projectRoot, 'src'),
      '@server': path.resolve(projectRoot, 'server'),
      '@shared': path.resolve(projectRoot, 'shared'),
      '@microservices/sender': path.resolve(projectRoot, 'microservices/sender/src'),
      '@tests': path.resolve(projectRoot, 'tests'),
    },
  },
  test: {
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    environment: 'node',
    setupFiles: ['tests/setup.ts'],
  },
});
