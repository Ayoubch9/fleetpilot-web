import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getMileVoxaAlerts } from "@/lib/fleetpilot-alerts";
import WeekSelector from "@/components/week-selector";
import GlobalSearch from "@/components/global-search";
import { getAvatarUrl } from "@/lib/fleetpilot-account";
import SidebarSignOut from "@/components/sidebar-sign-out";
import MobileAppNavigation from "@/components/mobile-app-navigation";
import MileVoxaBrand, { MileVoxaMark } from "@/components/milevoxa-brand";

type ActivePage =
  | "overview"
  | "loads"
  | "trucks"
  | "expenses"
  | "reimbursements"
  | "maintenance"
  | "settlement"
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
  ["loads", "Loads", "/loads", "truck"],
  ["trucks", "Trucks", "/trucks", "truck"],
  ["expenses", "Expenses", "/expenses", "expense"],
  ["maintenance", "Maintenance", "/maintenance", "tool"],
  ["reimbursements", "Reimbursements", "/reimbursements", "wallet"],
] as const;

const analytics = [
  ["settlement", "Weekly Settlement", "/settlement", "money"],
  ["deposit", "Security Deposit", "/security-deposit", "deposit"],
  ["fuel", "Fuel Analytics", "/fuel", "fuel"],
] as const;

const tools = [
  ["reports", "Reports", "/reports", "file"],
  ["pilot", "Pilot AI", "/pilot-ai", "spark"],
  ["documents", "Documents", "/documents", "file"],
] as const;



export default async function AppShell({
  active,
  fullName,
  companyName,
  role,
  children,
}: AppShellProps) {
  let alertCount = 0;
  let avatarUrl: string | null = null;

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
      const { data: profile } = await supabase
        .from("profiles")
        .select("avatar_path")
        .eq("id", user.id)
        .maybeSingle();

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
    <main className="min-h-screen bg-[#F7F9F8]">
      <aside className="fp-sidebar-fixed fixed inset-y-0 left-0 z-40 hidden bg-gradient-to-b from-[#102238] to-[#0D1E31] text-white lg:flex lg:flex-col">
        <div className="px-5 py-[16px]">
          <MileVoxaBrand
            href="/dashboard"
            onDark
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
          <SidebarSignOut />
        </div>

      </aside>

      <section className="min-h-screen lg:ml-[222px]">
        <header className="sticky top-0 z-30 flex h-[68px] items-center gap-4 border-b border-[#e0e8f0] bg-white/95 px-5 backdrop-blur-xl sm:px-6">
          <div className="lg:hidden">
            <Link
              href="/dashboard"
              className="fp-mobile-header-brand"
              aria-label="MileVoxa dashboard"
            >
              <MileVoxaMark className="h-7 w-7" />
              <img
                src="/branding/milevoxa-logo-horizontal.png"
                width={2000}
                height={445}
                className="mv-mobile-lockup"
                alt="MileVoxa"
              />
            </Link>
          </div>

          <div className="hidden max-w-[505px] flex-1 lg:block">
            <GlobalSearch />
          </div>

          <div className="ml-auto flex items-center gap-3 text-[#0b1730]">
            <div className="hidden md:block">
              <WeekSelector />
            </div>
            <Link
              href="/notifications"
              aria-label={`${alertCount} MileVoxa notifications`}
              className={`relative flex h-9 w-9 items-center justify-center rounded-full transition ${
                active === "notifications" ? "bg-[#EAF6EC]" : "hover:bg-[#f4f8fc]"
              }`}
            >
              <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-none stroke-[#263a53]" strokeWidth="1.8">
                <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/>
              </svg>
              {alertCount > 0 && (
                <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#16853B] px-[3px] text-[7px] font-black text-white">
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
                  <img src={avatarUrl} alt="" />
                ) : (
                  fullName?.[0]?.toUpperCase() || "F"
                )}
              </span>
              <span className="hidden sm:block">
                <span className="block text-[10px] font-[700]">{fullName}</span>
                <span className="mt-.5 block text-[8px] font-[600] text-[#7d8ea1]">{role || companyName || "Member"}</span>
              </span>
              <span className="hidden text-[#5f7188] sm:block">⌄</span>
            </Link>
          </div>
        </header>

        <div className="fp-mobile-control-zone lg:hidden">
          <div className="fp-mobile-global-search">
            <GlobalSearch />
          </div>
          <div className="fp-mobile-week-selector">
            <WeekSelector />
          </div>
        </div>

        {children}

        <MobileAppNavigation active={active} />
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
      <Icon type={icon} />
      <span>{label}</span>
    </Link>
  );
}

function Disabled({ label, icon }: { label: string; icon: string }) {
  return (
    <div className="flex h-[36px] items-center gap-3 rounded-[8px] px-3.5 text-[11px] font-[500] text-[#c3d0dd]">
      <Icon type={icon} />
      <span>{label}</span>
    </div>
  );
}

function Icon({ type }: { type: string }) {
  const p = {
    className: "h-[15px] w-[15px] fill-none stroke-current",
    viewBox: "0 0 24 24",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  if (type === "home") return <svg {...p}><path d="M3 11 12 3l9 8v10H3z"/><path d="M9 21v-6h6v6"/></svg>;
  if (type === "truck") return <svg {...p}><path d="M3 6h11v10H3zM14 9h4l3 3v4h-7z"/><circle cx="7" cy="18" r="2"/><circle cx="18" cy="18" r="2"/></svg>;
  if (type === "expense") return <svg {...p}><path d="M5 3h14v18H5z"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>;
  if (type === "tool") return <svg {...p}><path d="M14.5 6a4 4 0 0 0-5 5L4 16.5 7.5 20l5.5-5.5a4 4 0 0 0 5-5L15.5 12 12 8.5 14.5 6Z"/></svg>;
  if (type === "wallet") return <svg {...p}><path d="M4 6h16v12H4z"/><path d="M16 10h5v4h-5a2 2 0 0 1 0-4Z"/></svg>;
  if (type === "money") return <svg {...p}><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 9h8M8 13h5"/></svg>;
  if (type === "fuel") return <svg {...p}><path d="M6 3h9v18H6zM8 7h5"/><path d="M15 8h2l2 3v6a2 2 0 0 0 2 2"/></svg>;
  if (type === "deposit") return <svg {...p}><path d="M12 3 4 6v5c0 5 3.4 8.5 8 10 4.6-1.5 8-5 8-10V6l-8-3Z"/><path d="M9 11h6M12 8v6"/></svg>;
  if (type === "file") return <svg {...p}><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v5h5"/></svg>;
  if (type === "spark") return <svg {...p}><path d="m12 3 1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3Z"/></svg>;
  if (type === "settings") return <svg {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.8 1.8 0 0 0 .36 2l.06.06-2.76 2.76-.06-.06a1.8 1.8 0 0 0-2-.36 1.8 1.8 0 0 0-1.1 1.65V21H10v-.09A1.8 1.8 0 0 0 8.9 19.3a1.8 1.8 0 0 0-2 .36l-.06.06-2.76-2.76.06-.06a1.8 1.8 0 0 0 .36-2A1.8 1.8 0 0 0 2.85 13H2v-4h.85A1.8 1.8 0 0 0 4.5 7a1.8 1.8 0 0 0-.36-2l-.06-.06L6.84 2.2l.06.06a1.8 1.8 0 0 0 2 .36A1.8 1.8 0 0 0 10 1h4a1.8 1.8 0 0 0 1.1 1.62 1.8 1.8 0 0 0 2-.36l.06-.06 2.76 2.76-.06.06a1.8 1.8 0 0 0-.36 2A1.8 1.8 0 0 0 21.15 9H22v4h-.85A1.8 1.8 0 0 0 19.4 15Z"/></svg>;
  return <svg {...p}><circle cx="12" cy="12" r="8"/></svg>;
}
