/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',  // Route to internal API routes
      },
      {
        source: '/stock/:path*',
        destination: 'http://localhost:8000/stock/:path*',  // Stock data
      },
      {
        source: '/trade',
        destination: 'http://localhost:8000/trade',  // Trading
      },
      {
        source: '/trade-history/:path*',
        destination: 'http://localhost:8000/trade-history/:path*',  // History
      },
      {
        source: '/my-portfolio/:path*',
        destination: 'http://localhost:8000/my-portfolio/:path*',  // Portfolio
      }
    ]
  },
  output: 'standalone',
}

module.exports = nextConfig 