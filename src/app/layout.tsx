import type { Metadata } from "next";
import "./globals.css";
import "./reimbursements/reimbursements-control-center-v1.css";
import "./maintenance/maintenance-control-center-v1.css";
import "./expenses/expenses-control-center-v1.css";
import "./trucks/trucks-control-center-v1.css";
import "./load-decision/load-decision-control-center-v1.css";
import "./loads/loads-control-center-v1.css";
import "./dashboard/dashboard-control-center-v1.css";
import "./odometer/odometer-control-center-v1.css";
import "./security-deposit/security-deposit-control-center-v1.css";
import "./fuel/fuel-control-center-v1.css";
import "./control-center-notification-v1.css";
import "./notifications/notifications-control-center-v1.css";
import "./reports/reports-control-center-v1.css";
import "./pilot-ai/pilot-ai-control-center-v1.css";
import "./documents/documents-control-center-v1.css";
import "./forms-control-center-v1.css";
import "./app-shell-consistency-v1.css";
import "./readability-layout-audit-v1.css";
import { SITE_URL } from "@/lib/seo";

import GoogleAnalytics from "@/components/google-analytics";
import AnalyticsEvents from "@/components/analytics-events";

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

        <GoogleAnalytics />
        <AnalyticsEvents />

      </body>
    </html>
  );
}
