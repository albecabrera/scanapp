import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { createHash } from 'node:crypto'

const OUT_DIR = process.env.DEPLOY_PATH ?? '/Users/acabrera/xampp-data/htdocs/scanapp'

// Injects a content hash into sw.js replacing __SW_CACHE_VERSION__
function swHashPlugin() {
  return {
    name: 'sw-cache-hash',
    apply: 'build',
    closeBundle() {
      const swPath = join(OUT_DIR, 'sw.js')
      try {
        const sw = readFileSync(swPath, 'utf8')
        const hash = createHash('sha1').update(sw + Date.now()).digest('hex').slice(0, 8)
        writeFileSync(swPath, sw.replace('__SW_CACHE_VERSION__', hash))
      } catch {}
    },
  }
}

export default defineConfig(({ command }) => ({
  plugins: [react(), swHashPlugin()],
  base: command === 'build' ? '/scanapp/' : '/',
  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://localhost',
        changeOrigin: true,
        rewrite: path => '/scanapp' + path,
      },
    },
  },
  build: {
    outDir: OUT_DIR,
    emptyOutDir: false,
  },
}))
