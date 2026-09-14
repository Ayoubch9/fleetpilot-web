import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "FleetPilot",
    template: "%s | FleetPilot",
  },
  description: "Run your trucking business smarter with FleetPilot.",
  applicationName: "FleetPilot",
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#07172a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <a className="fp-skip-link" href="#fleetpilot-content">
          Skip to content
        </a>
        <div id="fleetpilot-content">{children}</div>
      </body>
    </html>
  );
}
