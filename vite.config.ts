import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// Mesma cor do fundo do app (--background) e do botão principal (--primary).
const COR_TEMA = '#ffffff'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // "prompt": a versão nova espera o usuário aceitar (nunca recarrega sozinha no meio de uma auditoria).
      registerType: 'prompt',
      // O registro é feito em src/pwa/atualizacao.ts.
      injectRegister: false,
      includeAssets: ['favicon.ico', 'favicon.svg', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'Auditorias',
        short_name: 'Auditorias',
        description: 'Auditorias e inspeções sanitárias para consultores de segurança alimentar.',
        lang: 'pt-BR',
        dir: 'ltr',
        id: '/',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: COR_TEMA,
        background_color: COR_TEMA,
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Só os arquivos do app (telas, estilos, scripts, fontes e ícones). Nenhum dado da API entra no cache:
        // sem `runtimeCaching`, toda chamada vai sempre à rede (modo offline está no backlog).
        globPatterns: ['**/*.{js,css,html,woff2,svg,png,ico}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        cleanupOutdatedCaches: true,
      },
    }),
  ],
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
  // `npm run preview` (build de produção local, onde o service worker funciona) usa o mesmo host e proxy.
})
