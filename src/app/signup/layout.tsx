import type { ReactNode } from "react";
import { publicPageMetadata } from "@/lib/seo";

export const metadata = publicPageMetadata({
  title: "Start Free Trial | MileVoxa",
  description:
    "Start your MileVoxa free trial to manage loads, expenses, trucks, maintenance, and trucking profitability in one place.",
  path: "/signup",
  noIndex: true,
});

export default function SignupLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
