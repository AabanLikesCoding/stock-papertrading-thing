/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/:path*' // Proxy to backend in development and production
      }
    ]
  }
}

module.exports = nextConfig 