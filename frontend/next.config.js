/** @type {import('next').NextConfig} */
const nextConfig = {
  // No rewrites needed as NGINX handles routing
  output: 'standalone',
}

module.exports = nextConfig 