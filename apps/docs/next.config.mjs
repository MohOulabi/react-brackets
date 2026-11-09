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
};

export default withMDX(config);
