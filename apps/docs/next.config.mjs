import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/** GitHub Pages serves the site from /react-brackets; locally it lives at the root. */
const basePath = process.env.DOCS_BASE_PATH ?? '';

/** @type {import('next').NextConfig} */
const config = {
  output: 'export',
  basePath,
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  images: { unoptimized: true },
  reactStrictMode: true,
  // Lets a phone on the same Wi-Fi load the dev server: DEV_ORIGINS=192.168.1.10 bun run dev
  allowedDevOrigins: process.env.DEV_ORIGINS?.split(',') ?? [],
};

export default withMDX(config);
