import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Plant Pruning Advisor',
        short_name: 'PruneAdvisor',
        description: 'AI-powered plant pruning guidance',
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
  },
})
