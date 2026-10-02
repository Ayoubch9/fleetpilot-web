import type { ReactNode } from "react";
import { publicPageMetadata } from "@/lib/seo";

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
  return children;
}
