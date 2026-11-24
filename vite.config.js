import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

const versionFile = path.resolve(__dirname, '../version.json');
const versionMeta = fs.existsSync(versionFile)
  ? JSON.parse(fs.readFileSync(versionFile, 'utf8'))
  : { version: 'v0.2.24112601', patchType: 'soft' };

export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(versionMeta.version)
  },
  server: {
    port: 5173,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      },
      '/cache': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
});
