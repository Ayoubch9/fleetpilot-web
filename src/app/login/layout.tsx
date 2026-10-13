import type { ReactNode } from "react";
import { JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { publicPageMetadata } from "@/lib/seo";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--mv-login-sans",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--mv-login-mono",
  display: "swap",
});

export const metadata = publicPageMetadata({
  title: "Sign In | MileVoxa",
  description:
    "Sign in to MileVoxa to manage your trucking business, loads, expenses, fleet, maintenance, and weekly profitability.",
  path: "/login",
  noIndex: true,
});

export default function LoginLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className={`${jakarta.variable} ${mono.variable}`}>
      {children}
    </div>
  );
}
