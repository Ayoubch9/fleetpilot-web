import type { MetadataRoute } from "next";
import { TOOL_DEFINITIONS } from "@/lib/free-tools";
import { absoluteUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const core: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/"),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: absoluteUrl("/pricing"),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: absoluteUrl("/tools"),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: absoluteUrl("/privacy"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: absoluteUrl("/terms"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: absoluteUrl("/data-deletion"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  const calculators: MetadataRoute.Sitemap = TOOL_DEFINITIONS.map((tool) => ({
    url: absoluteUrl(`/tools/${tool.slug}`),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  return [...core, ...calculators];
}
