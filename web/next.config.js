/** @type {import('next').NextConfig} */
const isElectronBuild = process.env.BUILD_TARGET === "electron";

const nextConfig = {
  reactStrictMode: true,
  // Electron loads the dashboard from local static files (file://), so for
  // that target we export fully static HTML/JS instead of relying on the
  // Next.js server. Regular `npm run build` (for normal web hosting) is
  // untouched.
  ...(isElectronBuild ? { output: "export", images: { unoptimized: true } } : {}),
};

module.exports = nextConfig;
