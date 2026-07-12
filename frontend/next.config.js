/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" }, // allows Clearbit/Bing image URLs; tighten for production
    ],
  },
};

module.exports = nextConfig;
