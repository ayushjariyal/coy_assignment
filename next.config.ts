import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The assignment specifies GET /feed, POST /swipe, GET /matches.
  // The handlers live under /api/*; these rewrites expose them at the exact paths too.
  async rewrites() {
    return [
      { source: "/feed", destination: "/api/feed" },
      { source: "/swipe", destination: "/api/swipe" },
      { source: "/matches", destination: "/api/matches" },
    ];
  },
};

export default nextConfig;
