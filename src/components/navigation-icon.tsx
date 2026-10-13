const navigationIcons: Record<string, string> = {
  home: "📊",
  load: "📦",
  decision: "🎯",
  truck: "🚛",
  expense: "⛽",
  maintenance: "🔧",
  reimbursements: "💵",
  settlement: "📑",
  odometer: "🛣️",
  deposit: "🔒",
  fuel: "📈",
  reports: "📋",
  pilot: "🤖",
  documents: "📁",
  notifications: "🔔",
  settings: "⚙️",
};

export default function NavigationIcon({
  type,
  className = "",
}: {
  type: string;
  className?: string;
}) {
  return (
    <span
      className={`fp-sidebar-emoji-icon ${className}`.trim()}
      aria-hidden="true"
    >
      {navigationIcons[type] ?? "•"}
    </span>
  );
}
