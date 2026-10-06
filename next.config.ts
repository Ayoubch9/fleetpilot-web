import type { NextConfig } from "next";

const privateRouteSources = [
  "/dashboard/:path*",
  "/action-center/:path*",
  "/load-decision/:path*",
  "/loads/:path*",
  "/trucks/:path*",
  "/expenses/:path*",
  "/maintenance/:path*",
  "/reimbursements/:path*",
  "/settlement/:path*",
  "/odometer/:path*",
  "/security-deposit/:path*",
  "/fuel/:path*",
  "/reports/:path*",
  "/documents/:path*",
  "/pilot-ai/:path*",
  "/settings/:path*",
  "/notifications/:path*",
  "/onboarding/:path*",
  "/account-deleted/:path*",
  "/login/:path*",
  "/signup/:path*",
  "/forgot-password/:path*",
  "/reset-password/:path*",
  "/health/:path*",
];

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(self), microphone=(), geolocation=(), payment=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
  {
    key: "Content-Security-Policy",
    value:
      "base-uri 'self'; object-src 'none'; frame-ancestors 'none'; upgrade-insecure-requests",
  },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.pexels.com",
        pathname: "/**",
      },
    ],
  },

  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "milevoxa.com" }],
        destination: "https://www.milevoxa.com/:path*",
        permanent: true,
      },
    ];
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      ...privateRouteSources.map((source) => ({
        source,
        headers: [
          {
            key: "X-Robots-Tag",
            value: "noindex, nofollow",
          },
          {
            key: "Cache-Control",
            value: "private, no-store",
          },
        ],
      })),
    ];
  },
};

export default nextConfig;
