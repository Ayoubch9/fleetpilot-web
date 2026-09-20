import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://milevoxa.com"),
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
    title: "MileVoxa",
    description: "Run your trucking business with clarity.",
    url: "https://milevoxa.com",
    siteName: "MileVoxa",
    type: "website",
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
