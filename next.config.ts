/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    turbo: {
      enabled: false  // 👈 CORRECT KEY - DISABLES TURBOPACK
    }
  }
};

module.exports = nextConfig;
