/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  typedRoutes: true,
  turbopack: {
    root: import.meta.dirname,
  },
};

export default nextConfig;
