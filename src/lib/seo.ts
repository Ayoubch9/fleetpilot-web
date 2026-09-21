import type { Metadata } from "next";

export const SITE_URL = "https://milevoxa.com";
export const SOCIAL_IMAGE_PATH = "/opengraph-image";

export function absoluteUrl(path = "/") {
  return new URL(path, SITE_URL).toString();
}

export function publicPageMetadata({
  title,
  description,
  path,
  noIndex = false,
}: {
  title: string;
  description: string;
  path: string;
  noIndex?: boolean;
}): Metadata {
  const canonical = absoluteUrl(path);
  const finalTitle = title.includes("MileVoxa")
    ? title
    : `${title} | MileVoxa`;

  return {
    title: { absolute: finalTitle },
    description,
    alternates: {
      canonical,
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
        }
      : {
          index: true,
          follow: true,
        },
    openGraph: {
      title: finalTitle,
      description,
      url: canonical,
      siteName: "MileVoxa",
      type: "website",
      images: [
        {
          url: SOCIAL_IMAGE_PATH,
          width: 1200,
          height: 630,
          alt: "MileVoxa — Trucking Profit, Expenses & Fleet Management",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: finalTitle,
      description,
      images: [SOCIAL_IMAGE_PATH],
    },
  };
}
