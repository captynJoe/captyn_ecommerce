/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      "i.ebayimg.com",         // ✅ Most product images
      "thumbs.ebaystatic.com", // ✅ Thumbnails
      "vi.vipr.ebaydesc.com"   // ✅ Occasionally used
    ],
  },
};

module.exports = nextConfig;
