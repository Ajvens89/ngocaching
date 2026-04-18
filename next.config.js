/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  buildExcludes: [/middleware-manifest\.json$/],
})

const nextConfig = {
  images: {
    unoptimized: true,
  },
  webpack: (config) => {
    config.resolve.fallback = { fs: false, net: false, tls: false }
    // mapbox-gl uses web workers — exclude from server bundle
    config.resolve.alias = {
      ...config.resolve.alias,
    }
    return config
  },
  transpilePackages: ['mapbox-gl'],
}

module.exports = withPWA(nextConfig)
