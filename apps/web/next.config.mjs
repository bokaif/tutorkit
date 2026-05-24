/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@workspace/ui"],
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
}

export default nextConfig
