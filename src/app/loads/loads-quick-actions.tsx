"use client";

export default function LoadsQuickActions() {
  function openAdd(mode: "add" | "import") {
    window.dispatchEvent(
      new CustomEvent("fleetpilot:open-add-load", {
        detail: { mode },
      })
    );
  }

  return (
    <div className="mt-3 grid gap-2">
      <ActionButton
        label="Add Load Manually"
        note="Enter load details yourself"
        type="add"
        primary
        onClick={() => openAdd("add")}
      />

      <ActionButton
        label="Import from Telegram"
        note="Paste a Telegram load message"
        type="telegram"
        onClick={() => openAdd("import")}
      />
    </div>
  );
}

function ActionButton({
  label,
  note,
  type,
  primary = false,
  onClick,
}: {
  label: string;
  note: string;
  type: "add" | "telegram";
  primary?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`fp-load-side-action fp-load-side-action-v2 ${
        primary ? "primary" : ""
      }`}
      onClick={onClick}
    >
      <span className="fp-load-side-icon">
        <ActionIcon type={type} />
      </span>

      <span className="fp-load-quick-copy">
        <strong>{label}</strong>
        <small>{note}</small>
      </span>

      <span>›</span>
    </button>
  );
}

function ActionIcon({
  type,
}: {
  type: "add" | "telegram";
}) {
  const common = {
    viewBox: "0 0 24 24",
    className: "h-[13px] w-[13px] fill-none stroke-current",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  if (type === "add") {
    return (
      <svg {...common}>
        <path d="M12 5v14M5 12h14" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="M21 4 10.5 14.5" />
      <path d="m21 4-6.5 16-4-5.5L4 10.5 21 4Z" />
    </svg>
  );
}
