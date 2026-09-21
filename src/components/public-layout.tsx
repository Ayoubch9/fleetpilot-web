import type { ReactNode } from "react";
import PublicFooter from "@/components/public-footer";
import PublicHeader from "@/components/public-header";

export default function PublicLayout({
  children,
  mainClassName = "",
}: {
  children: ReactNode;
  mainClassName?: string;
}) {
  return (
    <div className="fp-public-shell">
      <PublicHeader />
      <main className={mainClassName}>{children}</main>
      <PublicFooter />
    </div>
  );
}
