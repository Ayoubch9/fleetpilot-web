import type { ReactNode } from "react";
import { publicPageMetadata } from "@/lib/seo";

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
  return children;
}
