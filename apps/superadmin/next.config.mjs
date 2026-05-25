/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["*.trycloudflare.com"],
  transpilePackages: [
    "@astro/api-client",
    "@astro/api-contracts",
    "@astro/i18n",
    "@astro/theme-engine",
    "@astro/ui",
    "@astro/tenant-config",
    "@astro/mock-api",
    "@astro/analytics",
  ],
};

export default nextConfig;
