import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

const PRIVATE_ROUTES = [
  "/dashboard",
  "/loads",
  "/trucks",
  "/expenses",
  "/maintenance",
  "/reimbursements",
  "/settlement",
  "/fuel",
  "/reports",
  "/documents",
  "/pilot-ai",
  "/settings",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/auth/",
  "/onboarding",
  "/account-deleted",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: PRIVATE_ROUTES,
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
