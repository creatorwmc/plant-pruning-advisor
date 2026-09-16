import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Plants 101',
        short_name: 'Plants101',
        description: 'Houseplant care, identification, and herbalism',
        theme_color: '#8B2E1E',
        background_color: '#FAF6EE',
        display: 'standalone',
        launch_handler: { client_mode: 'focus-existing' },
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      }
    })
  ],
  server: {
    port: 5154,
    strictPort: true,
    proxy: {
      '/.netlify/functions': {
        target: 'http://localhost:9154',
        changeOrigin: true,
      },
    },
  },
})
