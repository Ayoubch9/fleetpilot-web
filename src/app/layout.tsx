import type { Metadata } from "next";
import "./globals.css";
import { SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "MileVoxa",
    template: "%s | MileVoxa",
  },
  description: "Run your trucking business with clarity.",
  applicationName: "MileVoxa",
  icons: {
    icon: "/branding/milevoxa-app-icon.png",
    shortcut: "/branding/milevoxa-app-icon.png",
    apple: "/branding/milevoxa-app-icon.png",
  },
  openGraph: {
    siteName: "MileVoxa",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a className="fp-skip-link" href="#milevoxa-content">
          Skip to content
        </a>
        <div id="milevoxa-content">{children}</div>
      </body>
    </html>
  );
}
