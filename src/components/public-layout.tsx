import type { ReactNode } from "react";
import PublicFooter from "@/components/public-footer";
import PublicHeader from "@/components/public-header";

export default function PublicLayout({
  children,
  mainClassName = "",
  chrome = "default",
}: {
  children: ReactNode;
  mainClassName?: string;
  chrome?: "default" | "none";
}) {
  const showChrome = chrome !== "none";

  return (
    <div className="fp-public-shell">
      {showChrome && <PublicHeader />}
      <main className={mainClassName}>{children}</main>
      {showChrome && <PublicFooter />}
    </div>
  );
}
