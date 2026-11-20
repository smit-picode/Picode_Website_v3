/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Case-study forms upload up to three screenshots (8 MB each) in one save.
    serverActions: { bodySizeLimit: "26mb" },
  },
};
 
export default nextConfig;
