import type { ReactNode } from "react";

export type KpiDeltaTone = "positive" | "negative" | "neutral";

export default function KpiTile({
  label,
  value,
  delta,
  deltaTone = "neutral",
  note,
  className = "",
}: {
  label: string;
  value: ReactNode;
  delta?: ReactNode;
  deltaTone?: KpiDeltaTone;
  note?: ReactNode;
  className?: string;
}) {
  return (
    <article className={`mv-kpi-tile ${className}`.trim()}>
      <div className="mv-kpi-label">{label}</div>
      <div className="mv-kpi-value fp-number">{value}</div>
      {delta != null && delta !== "" && (
        <div className={`mv-kpi-delta ${deltaTone}`}>{delta}</div>
      )}
      {note != null && note !== "" && (
        <div className="mv-kpi-note">{note}</div>
      )}
    </article>
  );
}
