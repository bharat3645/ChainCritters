import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Produces a self-contained .next/standalone build (minimal node_modules
  // subset + server) so the Docker image doesn't need the full dev toolchain.
  output: "standalone",
};

export default nextConfig;
