import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost',
        changeOrigin: true,
        rewrite: path => '/scanapp' + path,
      },
    },
  },
  build: {
    outDir: '/Users/acabrera/xampp-data/htdocs/scanapp',
    emptyOutDir: false,
  },
})
