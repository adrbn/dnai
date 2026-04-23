import type { NextConfig } from "next";

const config: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  reactStrictMode: true,
  devIndicators: { buildActivity: false, appIsrStatus: false },
};

export default config;
