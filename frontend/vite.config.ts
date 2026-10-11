import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

// El config lo ejecuta Node, pero el proyecto no trae @types/node.
const envNode = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {}
const backend = envNode.VITE_PROXY_TARGET || 'http://localhost:8000'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    watch: {
      // Docker Desktop on Windows may not forward bind-mount events.
      usePolling: true,
      interval: 300,
    },
    // En desarrollo todo pasa por el mismo origen: /api, /ws y /media se
    // reenvían a FastAPI, igual que lo hace Caddy en producción.
    proxy: {
      '/api': { target: backend, changeOrigin: true, rewrite: (p) => p.replace(/^\/api/, '') },
      '/media': { target: backend, changeOrigin: true },
      '/ws': { target: backend.replace(/^http/, 'ws'), ws: true },
    },
  },
})
