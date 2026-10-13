import Image from "next/image";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getMileVoxaAlerts } from "@/lib/fleetpilot-alerts";
import WeekSelector from "@/components/week-selector";
import GlobalSearch from "@/components/global-search";
import { getAvatarUrl } from "@/lib/fleetpilot-account";
import SidebarSignOut from "@/components/sidebar-sign-out";
import MobileAppNavigation from "@/components/mobile-app-navigation";
import NavigationIcon from "@/components/navigation-icon";
import MileVoxaBrand, { MileVoxaMark } from "@/components/milevoxa-brand";
import BetaFeedbackCenter, { BetaFeedbackTrigger } from "@/components/beta-feedback-center";
import { isPublicBetaEnabled } from "@/lib/beta-access";

const controlCenterSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--mv-control-sans",
  display: "swap",
});

const controlCenterMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--mv-control-mono",
  display: "swap",
});

type ActivePage =
  | "overview"
  | "loads"
  | "decision"
  | "trucks"
  | "expenses"
  | "reimbursements"
  | "maintenance"
  | "settlement"
  | "odometer"
  | "deposit"
  | "fuel"
  | "reports"
  | "documents"
  | "pilot"
  | "settings"
  | "notifications";

type AppShellProps = {
  active: ActivePage;
  fullName: string;
  companyName: string;
  role: string;
  children: React.ReactNode;
};

const operations = [
  ["overview", "Dashboard", "/dashboard", "home"],
  ["loads", "Loads", "/loads", "load"],
  ["decision", "Load Decision", "/load-decision", "decision"],
  ["trucks", "Trucks", "/trucks", "truck"],
  ["expenses", "Expenses", "/expenses", "expense"],
  ["maintenance", "Maintenance", "/maintenance", "maintenance"],
  ["reimbursements", "Reimbursements", "/reimbursements", "reimbursements"],
] as const;

const analytics = [
  ["settlement", "Weekly Settlement", "/settlement", "settlement"],
  ["odometer", "Weekly Odometer", "/odometer", "odometer"],
  ["deposit", "Security Deposit", "/security-deposit", "deposit"],
  ["fuel", "Fuel Analytics", "/fuel", "fuel"],
] as const;

const tools = [
  ["reports", "Reports", "/reports", "reports"],
  ["pilot", "Pilot AI", "/pilot-ai", "pilot"],
  ["documents", "Documents", "/documents", "documents"],
] as const;



export default async function AppShell({
  active,
  fullName,
  companyName,
  role,
  children,
}: AppShellProps) {
  const publicBeta = isPublicBetaEnabled();
  const showWeekSelector = ![
    "expenses",
    "decision",
    "trucks",
    "maintenance",
    "reimbursements",
    "reports",
    "settings",
    "pilot",
    "documents",
    "deposit",
  ].includes(active);
  let alertCount = 0;
  let avatarUrl: string | null = null;
  let businessRole = "";

  try {
    const supabase = await createClient();

    const [
      alerts,
      {
        data: { user },
      },
    ] = await Promise.all([
      getMileVoxaAlerts(supabase),
      supabase.auth.getUser(),
    ]);

    alertCount = alerts.length;

    if (user) {
      const profileResult = await supabase
        .from("profiles")
        .select("avatar_path, business_role")
        .eq("id", user.id)
        .maybeSingle();
      let profile = profileResult.data;

      if (profileResult.error) {
        const fallback = await supabase
          .from("profiles")
          .select("avatar_path")
          .eq("id", user.id)
          .maybeSingle();
        profile = fallback.data
          ? { ...fallback.data, business_role: null }
          : null;
      }

      businessRole =
        profile?.business_role ||
        (typeof user.user_metadata?.business_role === "string"
          ? user.user_metadata.business_role
          : "");

      avatarUrl = await getAvatarUrl(
        supabase,
        profile?.avatar_path || null
      );
    }
  } catch {
    alertCount = 0;
    avatarUrl = null;
  }

  return (
    <main className={`mv-app-shell min-h-screen bg-[#F7F9F8] ${(active === "overview" || active === "loads" || active === "decision" || active === "trucks" || active === "expenses" || active === "maintenance" || active === "reimbursements" || active === "settlement" || active === "odometer" || active === "deposit" || active === "fuel" || active === "reports" || active === "documents" || active === "pilot" || active === "notifications" || active === "settings") ? `${controlCenterSans.variable} ${controlCenterMono.variable}` : ""}`}>
      <aside className="fp-sidebar-fixed fixed inset-y-0 left-0 z-40 hidden bg-gradient-to-b from-[#102238] to-[#0B1730] text-white lg:flex lg:flex-col">
        <div className="px-5 py-[16px]">
          <MileVoxaBrand
            href="/dashboard"
            onDark={active !== "overview" && active !== "loads" && active !== "decision" && active !== "trucks" && active !== "expenses" && active !== "maintenance" && active !== "reimbursements" && active !== "settlement" && active !== "odometer" && active !== "deposit" && active !== "fuel" && active !== "reports" && active !== "documents" && active !== "pilot" && active !== "notifications" && active !== "settings"}
            className="mv-sidebar-brand"
          />
        </div>

        <div className="fp-scroll flex-1 overflow-y-auto px-3 pb-3">
          <NavSection
            title=""
            items={operations}
            active={active}
          />
          <NavSection
            title="Analytics"
            items={analytics}
            active={active}
            className="mt-2"
          />

          <div className="my-3 border-t border-white/10" />
          <NavSection title="Tools" items={tools} active={active} />

          <div className="my-3 border-t border-white/10" />
          <SideItem href="/settings" label="Settings" icon="settings" active={active === "settings"} />
          {publicBeta && (
            <BetaFeedbackTrigger
              className="fp-beta-sidebar-feedback"
              label="Send Feedback"
              context={`/${active}`}
            />
          )}
          <SidebarSignOut feedbackEnabled={publicBeta} />
        </div>

      </aside>

      <section className="fp-app-content min-h-screen lg:ml-[222px]">
        <header className="fp-app-header sticky top-0 z-30 flex h-[68px] items-center gap-4 border-b border-[#e0e8f0] bg-white/95 px-5 backdrop-blur-xl sm:px-6">
          <div className="fp-app-mobile-brand lg:hidden">
            <Link
              href="/dashboard"
              className="fp-mobile-header-brand"
              aria-label="MileVoxa dashboard"
            >
              <MileVoxaMark className="h-7 w-7" />
              <Image unoptimized
                src="/branding/milevoxa-logo-horizontal.png"
                width={2000}
                height={445}
                className="mv-mobile-lockup"
                alt="MileVoxa"
              />
            </Link>
          </div>

          <div className="fp-app-global-search hidden max-w-[505px] flex-1 lg:block">
            <GlobalSearch />
          </div>

          <div className="ml-auto flex items-center gap-3 text-[#0b1730]">
            {publicBeta && <span className="fp-beta-header-badge">Public Beta</span>}
            {showWeekSelector && (
              <div className="fp-app-week-selector hidden md:block">
                <WeekSelector />
              </div>
            )}
            <Link
              href="/notifications"
              aria-label={`${alertCount} MileVoxa notifications`}
              className={`fp-control-center-notification relative flex items-center justify-center transition ${active === "notifications" ? "is-active" : ""}`}
            >
              <span className="fp-control-center-notification-bell" aria-hidden="true">🔔</span>
              {alertCount > 0 && (
                <span className="fp-control-center-notification-count">
                  {alertCount > 99 ? "99+" : alertCount}
                </span>
              )}
            </Link>
            <Link
              href="/settings"
              className="fp-header-account"
              aria-label="Open profile settings"
            >
              <span className="fp-header-avatar">
                {avatarUrl ? (
                  <Image unoptimized width={64} height={64} src={avatarUrl} alt="" />
                ) : (
                  fullName?.[0]?.toUpperCase() || "F"
                )}
              </span>
              <span className="hidden sm:block">
                <span className="block text-[10px] font-[700]">{fullName}</span>
                <span className="mt-.5 block text-[8px] font-[600] text-[#7d8ea1]">{businessRole || role || companyName || "Member"}</span>
              </span>
              <span className="hidden text-[#5f7188] sm:block">⌄</span>
            </Link>
          </div>
        </header>

        <div
          className={`fp-mobile-control-zone lg:hidden ${
            showWeekSelector ? "" : "fp-mobile-control-zone-search-only"
          }`}
        >
          <div className="fp-mobile-global-search">
            <GlobalSearch />
          </div>
          {showWeekSelector && (
            <div className="fp-mobile-week-selector">
              <WeekSelector />
            </div>
          )}
        </div>

        {children}

        <MobileAppNavigation active={active} />
        {publicBeta && <BetaFeedbackCenter />}
      </section>
    </main>
  );
}
function NavSection({
  title,
  items,
  active,
  className = "",
}: {
  title: string;
  items: readonly (readonly [string, string, string, string])[];
  active: ActivePage;
  className?: string;
}) {
  return (
    <div className={className}>
      {title && (
        <div className="px-3 pb-1 text-[8px] font-[700] uppercase tracking-[.18em] text-[#7190ad]">
          {title}
        </div>
      )}
      <div className="space-y-[2px]">
        {items.map(([key, label, href, icon]) => (
          <SideItem
            key={`${href}-${label}`}
            href={href}
            label={label}
            icon={icon}
            active={active === key}
          />
        ))}
      </div>
    </div>
  );
}

function SideItem({
  href,
  label,
  icon,
  active,
}: {
  href: string;
  label: string;
  icon: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex h-[36px] items-center gap-3 rounded-[8px] px-3.5 text-[11px] font-[500] transition ${
        active
          ? "bg-gradient-to-r from-[#16853B] to-[#126F32] text-white shadow-[0_9px_24px_rgba(22,133,59,.20)]"
          : "text-[#d2deea] hover:bg-white/[.05] hover:text-white"
      }`}
    >
      <NavigationIcon type={icon} />
      <span>{label}</span>
    </Link>
  );
}
