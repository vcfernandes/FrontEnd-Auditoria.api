import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    // Aceita acesso pela rede local (ex.: testar no celular pelo Wi-Fi).
    host: true,
    proxy: {
      // /api/* -> http://localhost:8080/* (o front chama sempre a própria origem).
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (caminho) => caminho.replace(/^\/api/, ''),
        configure: (proxy) => {
          // O backend só libera CORS para localhost:5173. Pelo proxy a chamada é
          // servidor-a-servidor, então tiramos o Origin (que seria o IP da rede).
          proxy.on('proxyReq', (proxyReq) => proxyReq.removeHeader('origin'))
        },
      },
    },
  },
})
