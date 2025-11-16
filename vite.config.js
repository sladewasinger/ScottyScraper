import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  base: './',
  plugins: [vue()],
  build: {
    // Output to repository-level docs/ folder so GitHub Pages can serve root index.html
    outDir: 'docs',
    emptyOutDir: true
  }
})
