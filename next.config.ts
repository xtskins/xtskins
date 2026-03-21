import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  // steam-session → bytebuffer tenta resolver `memcpy` (addon nativo) no bundle; manter no node_modules em runtime
  serverExternalPackages: ['steam-session', 'bytebuffer', 'websocket13'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'steamcommunity-a.akamaihd.net',
      },
      {
        protocol: `https`,
        hostname: `community.cloudflare.steamstatic.com`,
      },
      {
        protocol: `https`,
        hostname: `steamcdn-a.akamaihd.net`,
      },
      {
        protocol: `https`,
        hostname: `avatars.steamstatic.com`,
      },
      {
        protocol: `https`,
        hostname: `community.akamai.steamstatic.com`,
      },
      {
        protocol: `https`,
        hostname: `cdn.steamstatic.com`,
      },
    ],
  },
}

export default nextConfig
