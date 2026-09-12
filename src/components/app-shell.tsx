import Link from "next/link";

type ActivePage =
  | "overview"
  | "loads"
  | "trucks"
  | "expenses"
  | "reimbursements"
  | "maintenance"
  | "settlement"
  | "fuel"
  | "reports"
  | "documents"
  | "pilot"
  | "settings";

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
  ["fuel", "Fuel Analytics", "/fuel", "fuel"],
] as const;

const tools = [
  ["reports", "Reports", "/reports", "file"],
  ["pilot", "Pilot AI", "/pilot-ai", "spark"],
  ["documents", "Documents", "/documents", "file"],
] as const;


function currentWeekLabel() {
  const now = new Date();
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const day = date.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(date);
  monday.setDate(date.getDate() + mondayOffset);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const monthDay = (d: Date) =>
    new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(d);

  return `${monthDay(monday)} – ${monthDay(sunday)}, ${sunday.getFullYear()}`;
}

export default function AppShell({
  active,
  fullName,
  companyName,
  role,
  children,
}: AppShellProps) {
  const weekLabel = currentWeekLabel();

  return (
    <main className="min-h-screen bg-[#f4f7fb]">
      <aside className="fp-sidebar-fixed fixed inset-y-0 left-0 z-40 hidden bg-gradient-to-b from-[#07172a] to-[#0a1c33] text-white lg:flex lg:flex-col">
        <div className="px-5 py-[16px]">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <Logo />
            <div>
              <div className="text-[20px] font-[780] tracking-[-.045em]">
                Fleet<span className="text-[#2298ff]">Pilot</span>
              </div>
              <div className="mt-.5 text-[6.5px] font-black uppercase tracking-[.18em] text-[#9db1c6]">
                Drive smarter. Earn more.
              </div>
            </div>
          </Link>
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
        </div>

        <div className="p-3.5 pt-1">
          <div className="rounded-[12px] border border-[#1d3955] bg-[#0d2340] p-4">
            <div className="text-[10.5px] font-[750] text-[#319fff]">Upgrade to Pro</div>
            <div className="mt-1.5 text-[8px] leading-4 text-[#8ba2b8]">
              Unlock advanced analytics,<br />exports and premium tools.
            </div>
            <button className="mt-3 w-full rounded-[8px] bg-[#168eff] py-2.5 text-[10px] font-black text-white">
              View Plans →
            </button>
          </div>
        </div>
      </aside>

      <section className="min-h-screen lg:ml-[222px]">
        <header className="sticky top-0 z-30 flex h-[68px] items-center gap-4 border-b border-[#e0e8f0] bg-white/95 px-5 backdrop-blur-xl sm:px-6">
          <div className="lg:hidden">
            <Link href="/dashboard" className="flex items-center gap-2 text-[#0b1730]">
              <Logo />
              <span className="font-black">Fleet<span className="text-[#1188ff]">Pilot</span></span>
            </Link>
          </div>

          <div className="hidden max-w-[505px] flex-1 lg:block">
            <div className="relative">
              <svg viewBox="0 0 24 24" className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 fill-none stroke-[#8899aa]" strokeWidth="2">
                <circle cx="11" cy="11" r="7" /><path d="m20 20-3-3" />
              </svg>
              <input
                placeholder="Search loads, trucks, expenses..."
                className="w-full rounded-[10px] border border-[#dde6ef] bg-[#f8fbfe] py-3 pl-11 pr-4 text-[11px] text-[#263a53] outline-none placeholder:text-[#95a6b8]"
              />
            </div>
          </div>

          <div className="ml-auto flex items-center gap-3 text-[#0b1730]">
            <div className="hidden rounded-[10px] border border-[#dfe7ef] bg-[#fbfdff] px-4 py-2.5 text-[10px] font-black md:block">
              {weekLabel}
            </div>
            <div className="relative flex h-9 w-9 items-center justify-center">
              <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-none stroke-[#263a53]" strokeWidth="1.8">
                <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/>
              </svg>
              <span className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-full bg-[#1188ff] text-[8px] font-black text-white">3</span>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#07172a] text-[11px] font-black text-white">
              {fullName?.[0]?.toUpperCase() || "F"}
            </div>
            <div className="hidden sm:block">
              <div className="text-[10px] font-[700]">{fullName}</div>
              <div className="mt-.5 text-[8px] font-[600] text-[#7d8ea1]">{role || companyName || "Member"}</div>
            </div>
            <span className="hidden text-[#5f7188] sm:block">⌄</span>
          </div>
        </header>

        <div className="fp-scroll border-b border-[#dfe7ef] bg-white px-3 py-2 lg:hidden">
          <div className="flex gap-2 overflow-x-auto">
            {[...operations, ...analytics, ...tools, ["settings", "Settings", "/settings", "settings"] as const].map(([key, label, href]) => (
              <Link
                key={`${href}-${label}`}
                href={href}
                className={`whitespace-nowrap rounded-[8px] px-3 py-2 text-[10px] font-black ${
                  active === key
                    ? "bg-[#1188ff] text-white"
                    : "bg-[#f1f5f9] text-[#65758a]"
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        {children}
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

function Logo() {
  return (
    <svg viewBox="0 0 28 28" className="h-8 w-8">
      <path d="M2 14.8 26 2 18.2 26l-4.7-9.2L2 14.8Z" fill="#1188ff" />
      <path d="m13.5 16.8 5.2-7.1" fill="none" stroke="#9fd2ff" strokeWidth="1.5" />
    </svg>
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
          ? "bg-gradient-to-r from-[#178fff] to-[#0b79e8] text-white shadow-[0_9px_24px_rgba(17,136,255,.18)]"
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
  if (type === "file") return <svg {...p}><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v5h5"/></svg>;
  if (type === "spark") return <svg {...p}><path d="m12 3 1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3Z"/></svg>;
  if (type === "settings") return <svg {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.8 1.8 0 0 0 .36 2l.06.06-2.76 2.76-.06-.06a1.8 1.8 0 0 0-2-.36 1.8 1.8 0 0 0-1.1 1.65V21H10v-.09A1.8 1.8 0 0 0 8.9 19.3a1.8 1.8 0 0 0-2 .36l-.06.06-2.76-2.76.06-.06a1.8 1.8 0 0 0 .36-2A1.8 1.8 0 0 0 2.85 13H2v-4h.85A1.8 1.8 0 0 0 4.5 7a1.8 1.8 0 0 0-.36-2l-.06-.06L6.84 2.2l.06.06a1.8 1.8 0 0 0 2 .36A1.8 1.8 0 0 0 10 1h4a1.8 1.8 0 0 0 1.1 1.62 1.8 1.8 0 0 0 2-.36l.06-.06 2.76 2.76-.06.06a1.8 1.8 0 0 0-.36 2A1.8 1.8 0 0 0 21.15 9H22v4h-.85A1.8 1.8 0 0 0 19.4 15Z"/></svg>;
  return <svg {...p}><circle cx="12" cy="12" r="8"/></svg>;
}
