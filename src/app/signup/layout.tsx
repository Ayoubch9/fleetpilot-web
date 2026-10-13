import type { ReactNode } from "react";
import { JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { publicPageMetadata } from "@/lib/seo";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--mv-signup-sans",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--mv-signup-mono",
  display: "swap",
});

export const metadata = publicPageMetadata({
  title: "Join the Free Beta | MileVoxa",
  description:
    "Join the free MileVoxa public beta to manage loads, expenses, trucks, maintenance, weekly settlements, and trucking profitability in one place.",
  path: "/signup",
  noIndex: true,
});

export default function SignupLayout({
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
