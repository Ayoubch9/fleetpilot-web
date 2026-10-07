export type MileVoxaAnalyticsEvent =
  | "join_beta_click"
  | "sign_up"
  | "login"
  | "free_tool_used"
  | "load_decision_used"
  | "feedback_submitted";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackEvent(
  event: MileVoxaAnalyticsEvent,
  params: Record<string, string | number | boolean> = {}
) {
  if (typeof window === "undefined") return;
  if (typeof window.gtag !== "function") return;

  window.gtag("event", event, {
    ...params,
  });
}