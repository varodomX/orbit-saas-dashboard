import type { NextConfig } from "next";
const config: NextConfig = { poweredByHeader: false, serverExternalPackages: ['sql.js'], distDir: process.env.ORBIT_BUILD_DIR || '.next' };
export default config;
