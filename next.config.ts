/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Permissions-Policy", value: "window-management=(self)" },
        ],
      },
    ];
  },
};
module.exports = nextConfig;
