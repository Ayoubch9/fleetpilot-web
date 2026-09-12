import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/"],
        disallow: [
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
        ],
      },
    ],
  };
}
