"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";

export default function AnalyticsEvents() {
  useEffect(() => {
    function handleClick(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest("a");

      if (!anchor) return;

      const href = anchor.getAttribute("href") || "";
      const text = anchor.textContent?.trim() || "";

      // Public Beta CTA
      if (
        href === "/signup" ||
        href.endsWith("/signup") ||
        text.toLowerCase().includes("join the free beta") ||
        text.toLowerCase().includes("join free beta")
      ) {
        trackEvent("join_beta_click", {
          link_text: text,
          destination: href,
          page_path: window.location.pathname,
        });
      }

      // Free-tool usage / entry
      if (href.startsWith("/tools/")) {
        trackEvent("free_tool_used", {
          tool_path: href,
          link_text: text,
          page_path: window.location.pathname,
        });
      }
    }

    document.addEventListener("click", handleClick);

    return () => {
      document.removeEventListener("click", handleClick);
    };
  }, []);

  return null;
}