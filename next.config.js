/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  buildExcludes: [/middleware-manifest\.json$/],
  // Nie cache'uj Firebase/Google API — service worker nie może
  // przechwytywać tokenów Auth innych aplikacji (DroneTower itp.)
  runtimeCaching: [
    // Google Fonts — cache OK
    {
      urlPattern: /^https:\/\/fonts\.(?:gstatic|googleapis)\.com\/.*/i,
      handler: 'CacheFirst',
      options: { cacheName: 'google-fonts', expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 } },
    },
    // Mapbox tiles — cache OK (mapy ładują się szybciej offline)
    {
      urlPattern: /^https:\/\/(?:api|events)\.mapbox\.com\/.*/i,
      handler: 'NetworkOnly', // mapbox wymaga aktualnych danych
    },
    // Firebase / Google API — NIGDY nie cache'uj, zawsze przez sieć
    {
      urlPattern: /^https:\/\/.*\.googleapis\.com\/.*/i,
      handler: 'NetworkOnly',
    },
    {
      urlPattern: /^https:\/\/.*\.firebaseio\.com\/.*/i,
      handler: 'NetworkOnly',
    },
    {
      urlPattern: /^https:\/\/.*\.firebaseapp\.com\/.*/i,
      handler: 'NetworkOnly',
    },
    {
      urlPattern: /^https:\/\/identitytoolkit\.googleapis\.com\/.*/i,
      handler: 'NetworkOnly',
    },
    // Statyczne zasoby Next.js — cache z rewalidacją
    {
      urlPattern: /\/_next\/static\/.*/i,
      handler: 'StaleWhileRevalidate',
      options: { cacheName: 'next-static', expiration: { maxEntries: 128, maxAgeSeconds: 60 * 60 * 24 } },
    },
    // Obrazki
    {
      urlPattern: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
      handler: 'StaleWhileRevalidate',
      options: { cacheName: 'images', expiration: { maxEntries: 64, maxAgeSeconds: 60 * 60 * 24 } },
    },
    // API własne — zawsze sieć
    {
      urlPattern: /^\/api\/.*/i,
      handler: 'NetworkOnly',
    },
    // Strony aplikacji — Network First (szybki fallback offline)
    {
      urlPattern: ({ url }) => url.origin === 'self',
      handler: 'NetworkFirst',
      options: { cacheName: 'pages', networkTimeoutSeconds: 10, expiration: { maxEntries: 32, maxAgeSeconds: 60 * 60 * 24 } },
    },
  ],
})

const nextConfig = {
  images: {
    unoptimized: true,
  },
  webpack: (config) => {
    config.resolve.fallback = { fs: false, net: false, tls: false }
    return config
  },
  transpilePackages: ['mapbox-gl'],
}

module.exports = withPWA(nextConfig)
