import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allows the dev server's HMR/asset requests when accessed via 127.0.0.1 instead of
  // localhost (both resolve to the same machine, but Next.js treats them as different
  // origins for its dev-only cross-origin protection). Dev-only setting, irrelevant in
  // production builds.
  allowedDevOrigins: ["127.0.0.1", "localhost"],
};

export default nextConfig;
