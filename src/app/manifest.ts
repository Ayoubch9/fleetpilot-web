import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MileVoxa",
    short_name: "MileVoxa",
    description: "Run your trucking business with clarity.",
    start_url: "/",
    display: "standalone",
    background_color: "#F7F9F8",
    theme_color: "#102238",
    icons: [
      {
        src: "/branding/milevoxa-app-icon.png",
        sizes: "1024x1024",
        type: "image/png",
      },
    ],
  };
}
