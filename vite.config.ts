import { fileURLToPath, URL } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

/**
 * Aliases are intentionally coarse: one per top-level `src/` directory. Deep aliases
 * ("@endpoints") hide the layering rule that `.eslintrc.cjs` enforces, and we would rather
 * a bad import look bad in the diff.
 */
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@api': fileURLToPath(new URL('./src/api', import.meta.url)),
      '@app': fileURLToPath(new URL('./src/app', import.meta.url)),
      '@components': fileURLToPath(new URL('./src/components', import.meta.url)),
      '@config': fileURLToPath(new URL('./src/config', import.meta.url)),
      '@features': fileURLToPath(new URL('./src/features', import.meta.url)),
      '@hooks': fileURLToPath(new URL('./src/hooks', import.meta.url)),
      '@lib': fileURLToPath(new URL('./src/lib', import.meta.url)),
      '@types': fileURLToPath(new URL('./src/types', import.meta.url)),
    },
  },
  define: {
    // Read once, at build time. Nothing in src/ may touch these directly — src/config/env.ts
    // is the only module allowed to see import.meta.env at all.
    __CONSOLE_VERSION__: JSON.stringify(process.env.npm_package_version ?? '0.0.0-dev'),
    __BUILD_SHA__: JSON.stringify(process.env.GIT_SHA ?? 'local'),
    __PAYZENO_API_VERSION__: JSON.stringify('2026-01-15'),
