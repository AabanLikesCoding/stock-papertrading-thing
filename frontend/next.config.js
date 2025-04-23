/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.NODE_ENV === 'production' 
          ? 'http://localhost:8000/:path*'  // In production, proxy to the backend on the same container
          : 'http://localhost:8000/:path*'  // In development, proxy to local backend
      }
    ]
  },
  output: 'standalone',
}

module.exports = nextConfig 