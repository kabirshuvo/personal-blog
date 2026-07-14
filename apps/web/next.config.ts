import type { NextConfig } from 'next';
import path from 'node:path';

const nextConfig: NextConfig = {
  transpilePackages: ['@blog/database'],
  outputFileTracingRoot: path.join(__dirname, '../..'),
};

export default nextConfig;
