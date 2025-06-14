import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
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
    ],
  },
}

export default nextConfig
