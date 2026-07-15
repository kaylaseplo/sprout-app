import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // Only precache the built static app shell (HTML/CSS/JS + icons/fonts).
      // No runtimeCaching rules are configured, so every Supabase API,
      // auth, and Storage request (including private photo URLs) always
      // goes to the network and is never cached or served offline.
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Sprout',
        short_name: 'Sprout',
        description: "The teacher's assistant that never clocks out.",
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#fffaf1',
        theme_color: '#3f7a5a',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          {
            src: '/icons/icon-maskable-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: '/icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Precache only the static build output — no runtime caching entries
        // are added, so nothing dynamic (Supabase API/auth/storage calls,
        // including private photo URLs) is ever cached or served offline.
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
      },
    }),
  ],
})
