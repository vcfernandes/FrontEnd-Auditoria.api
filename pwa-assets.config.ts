import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

const FUNDO = '#171717'

// Gera os PNGs de public/ a partir de public/icon.svg: npm run generate-pwa-assets
export default defineConfig({
  preset: {
    ...minimal2023Preset,
    // O SVG já tem fundo cheio e o desenho na zona segura: sem margem extra nos ícones com fundo.
    maskable: { sizes: [512], padding: 0, resizeOptions: { background: FUNDO } },
    apple: { sizes: [180], padding: 0, resizeOptions: { background: FUNDO } },
  },
  images: ['public/icon.svg'],
})
