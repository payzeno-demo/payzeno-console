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
    // `pnpm dev:mock` boots the whole app on MockTransport. Sales demo, no backend.
    __FORCE_MOCK_TRANSPORT__: JSON.stringify(mode === 'mock'),
  },
  server: {
    port: 5173,
    strictPort: true,
    // In compose the console is served by payzeno-nginx, so /v1 and /ws are same-origin.
    // Locally we proxy so the pz_csrf cookie stays first-party — CSRF breaks otherwise.
    proxy: {
      '/v1': { target: 'http://localhost:8080', changeOrigin: false },
      '/ws': { target: 'ws://localhost:8080', ws: true },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    target: 'es2022',
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      // Two entries, one bundle (RFC platform-v2 §1): the merchant console and the staff admin
      // back office share the design system, the transport and the vendor chunks below. Both
      // HTML files land at the dist root — payzeno-nginx serves `index.html` on the console
      // host and `admin.html` on admin.localhost / admin.payzeno.com.
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        admin: fileURLToPath(new URL('./admin.html', import.meta.url)),
      },
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          query: ['@tanstack/react-query', '@tanstack/react-table'],
          // recharts is ~250kB and only the reporting route needs it.
          charts: ['recharts'],
          telemetry: ['@sentry/react'],
        },
      },
    },
  },
}));
