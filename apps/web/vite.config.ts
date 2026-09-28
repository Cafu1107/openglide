import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Relative base so the build works on GitHub Pages, any sub-path, and inside
// a future desktop shell (Electron/Tauri load it from the file system).
export default defineConfig({
  base: './',
  plugins: [react()],
  build: { target: 'es2022', sourcemap: true },
});
