import type { NextConfig } from "next";

const config: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  reactStrictMode: true,
  devIndicators: { position: "bottom-right" },
};

export default config;
