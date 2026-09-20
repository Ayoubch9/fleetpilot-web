import Link from "next/link";

export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && (
          <div className="fp-overline text-[#16853B]">
            {eyebrow}
          </div>
        )}
        <h1 className="fp-elegant-title mt-2 text-[29px] sm:text-[32px]">
          {title}
        </h1>
        {description && (
          <p className="fp-elegant-body mt-1.5 max-w-2xl text-[13px] leading-[1.55]">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  change,
  tone = "default",
  icon,
}: {
  label: string;
  value: string;
  change?: string;
  tone?: "default" | "green" | "red" | "blue" | "orange" | "purple";
  icon?: React.ReactNode;
}) {
  const meta = {
    default: {
      accent: "#7d91a5",
      soft: "#f1f5f9",
      icon: "#425875",
      change: "#5d7088",
    },
    green: {
      accent: "#17b768",
      soft: "#eaf9f1",
      icon: "#11a55e",
      change: "#199a5b",
    },
    red: {
      accent: "#f05c67",
      soft: "#fff0f2",
      icon: "#e85360",
      change: "#eb5360",
    },
    blue: {
      accent: "#2f8df4",
      soft: "#eef6ff",
      icon: "#238bf5",
      change: "#19945c",
    },
    orange: {
      accent: "#f0a335",
      soft: "#fff6e9",
      icon: "#de901e",
      change: "#c88425",
    },
    purple: {
      accent: "#6e62f3",
      soft: "#f2f0ff",
      icon: "#6f61ef",
      change: "#19945c",
    },
  }[tone];

  return (
    <div
      className="fp-metric-card"
      style={{ "--metric-accent": meta.accent } as React.CSSProperties}
    >
      <div className="fp-metric-accent" />

      <div className="fp-metric-top">
        <div
          className="fp-metric-icon"
          style={{
            backgroundColor: meta.soft,
            color: meta.icon,
          }}
        >
          {icon || <span className="text-lg font-[700]">•</span>}
        </div>

        <div className="min-w-0 flex-1">
          <div className="fp-metric-label">{label}</div>
          <div className="fp-number fp-metric-value">{value}</div>
        </div>

        <div className="fp-metric-spark">
          <Sparkline tone={tone} />
        </div>
      </div>

      <div className="fp-metric-bottom">
        <span
          className="fp-metric-change"
          style={{ color: meta.change }}
        >
          {change || "No comparison"}
        </span>

        <span className="fp-metric-dot" style={{ backgroundColor: meta.accent }} />
      </div>
    </div>
  );
}

function Sparkline({
  tone,
}: {
  tone: "default" | "green" | "red" | "blue" | "orange" | "purple";
}) {
  const meta = {
    default: {
      stroke: "#7d91a5",
      points: "3,28 10,24 17,25 24,19 31,22 38,16 45,18 52,12 59,14 66,8 74,5",
    },
    green: {
      stroke: "#17b768",
      points: "3,29 10,23 17,25 24,18 31,21 38,13 45,17 52,10 59,12 66,7 74,4",
    },
    red: {
      stroke: "#f05c67",
      points: "3,28 10,24 17,26 24,18 31,21 38,14 45,17 52,10 59,12 66,7 74,3",
    },
    blue: {
      stroke: "#2f8df4",
      points: "3,27 10,22 17,24 24,17 31,21 38,13 45,16 52,9 59,11 66,6 74,3",
    },
    orange: {
      stroke: "#f0a335",
      points: "3,28 10,25 17,21 24,24 31,17 38,19 45,13 52,15 59,9 66,11 74,5",
    },
    purple: {
      stroke: "#6e62f3",
      points: "3,27 10,22 17,24 24,17 31,20 38,12 45,16 52,9 59,11 66,6 74,3",
    },
  }[tone];

  const coords = meta.points
    .split(" ")
    .map((pair) => pair.split(",").map(Number));

  const areaPath = [
    `M ${coords[0][0]} ${coords[0][1]}`,
    ...coords.slice(1).map(([x, y]) => `L ${x} ${y}`),
    "L 74 38",
    "L 3 38",
    "Z",
  ].join(" ");

  return (
    <svg viewBox="0 0 78 38" className="h-full w-full overflow-visible">
      <defs>
        <linearGradient id={`metric-area-${tone}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={meta.stroke} stopOpacity=".16" />
          <stop offset=".72" stopColor={meta.stroke} stopOpacity=".035" />
          <stop offset="1" stopColor={meta.stroke} stopOpacity="0" />
        </linearGradient>
      </defs>

      <line
        x1="2"
        y1="32.5"
        x2="76"
        y2="32.5"
        stroke="#dfe7ef"
        strokeWidth=".7"
        strokeDasharray="2 3"
      />
      <line
        x1="2"
        y1="19"
        x2="76"
        y2="19"
        stroke="#edf2f6"
        strokeWidth=".6"
        strokeDasharray="2 3"
      />

      <path d={areaPath} fill={`url(#metric-area-${tone})`} />

      <polyline
        points={meta.points}
        fill="none"
        stroke={meta.stroke}
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {coords.slice(0, -1).map(([x, y], index) => (
        <circle
          key={index}
          cx={x}
          cy={y}
          r=".85"
          fill={meta.stroke}
          opacity=".52"
        />
      ))}

      <circle
        cx={coords[coords.length - 1][0]}
        cy={coords[coords.length - 1][1]}
        r="2.25"
        fill="#fff"
        stroke={meta.stroke}
        strokeWidth="1.45"
      />
    </svg>
  );
}

export function SectionPanel({
  title,
  right,
  children,
  className = "",
}: {
  title: React.ReactNode;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`fp-card fp-subtle-card overflow-hidden rounded-[14px] ${className}`}>
      <div className="flex items-center justify-between gap-4 px-[18px] py-[14px]">
        <h2 className="text-[14.5px] font-[740] tracking-[-.02em] text-[#0a1730]">{title}</h2>
        {right}
      </div>
      {children}
    </section>
  );
}

export function StatusBadge({
  children,
  tone = "blue",
}: {
  children: React.ReactNode;
  tone?: "blue" | "green" | "red" | "orange" | "gray";
}) {
  const colors = {
    blue: "bg-[#e4f1ff] text-[#147cdc]",
    green: "bg-[#e0f7eb] text-[#12955a]",
    red: "bg-[#fde8ea] text-[#d94754]",
    orange: "bg-[#fff1dc] text-[#cc8116]",
    gray: "bg-[#eff3f7] text-[#708197]",
  }[tone];

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[8.5px] font-[750] ${colors}`}>
      {children}
    </span>
  );
}

export function EmptyState({ text }: { text: string }) {
  return (
    <div className="p-9 text-center text-[11px] font-[600] text-[#8a9aaa]">
      {text}
    </div>
  );
}

export function TinyBar({
  value,
  max,
  tone = "blue",
}: {
  value: number;
  max: number;
  tone?: "blue" | "green" | "red" | "orange";
}) {
  const color = {
    blue: "bg-[#16853B]",
    green: "bg-[#17c978]",
    red: "bg-[#ff4e5b]",
    orange: "bg-[#ffae35]",
  }[tone];

  const pct = Math.max(3, Math.min(100, max > 0 ? (value / max) * 100 : 0));
  return (
    <div className="h-[5px] overflow-hidden rounded-full bg-[#edf2f7]">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function ActionLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className="fp-secondary-button">
      {children}
    </Link>
  );
}
