import type { NextConfig } from "next";

const isGitHubPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  ...(isGitHubPages
    ? {
        output: "export",
        trailingSlash: true,
        basePath: "/pizzaria-platform",
        assetPrefix: "/pizzaria-platform/",
        images: {
          unoptimized: true,
        },
      }
    : {
        images: {
          remotePatterns: [
            {
              protocol: "https",
              hostname: "**",
            },
          ],
        },
      }),
};

export default nextConfig;
