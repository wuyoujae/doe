import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { editorRuntime } from './editor-plugin.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
// Test/development instances can use a separate local backend without changing saved model settings.
const apiTarget = process.env.YRKIE_API_TARGET || 'http://127.0.0.1:7763';
export default defineConfig({
  plugins: [editorRuntime(), react()],
  resolve: {
    alias: {
      '@yrkie/application/components/LucideIconPicker.tsx': path.resolve(here, 'src/pages/work/components/LucideIconPicker.tsx'),
      '@yrkie/application/lib/pptxPreview/lucideIcons.ts': path.resolve(here, 'src/pages/work/adapters/lucideIcons.ts'),
      '@yrkie/application/services/platform/webApi.ts': path.resolve(here, 'src/pages/work/adapters/webApi.ts'),
      '@yrkie/doe': path.resolve(here, '../packages/doe'), '@yrkie/application': path.resolve(here, 'src'),
    },
    dedupe: ['react', 'react-dom', 'react-i18next', 'i18next'],
  },
  server: {
    host: '127.0.0.1', port: 7762, strictPort: true,
    fs: {
      allow: [path.resolve(here, '..')],
      deny: ['.env', '.env.*', '*.{crt,pem}', '**/.git/**', '**/.run-data/**', '**/.venv/**',
        '**/master.key', '**/*-token', '**/yrkie.sqlite3*',
        `${path.resolve(here, '..', process.env.YRKIE_DATA_DIR || '.run-data/backend').replaceAll('\\', '/')}/**`],
    },
    proxy: { '/api/v1': { target: apiTarget, changeOrigin: true } },
  },
  preview: { proxy: { '/api/v1': { target: apiTarget, changeOrigin: true } } },
  build: { target: 'es2022' },
});
