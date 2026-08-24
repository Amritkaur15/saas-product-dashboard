import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Project already has a curated CLAUDE.md; stop `next dev` from appending
  // its own agent-rules block to it.
  agentRules: false,
};

export default nextConfig;
