"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { MileVoxaAlert } from "@/lib/fleetpilot-alerts";

type Filter = "all" | "critical" | "warning" | "info";

export default function NotificationCenter({
  alerts,
}: {
  alerts: MileVoxaAlert[];
}) {
  const [filter, setFilter] = useState<Filter>("all");

  const counts = useMemo(
    () => ({
      all: alerts.length,
      critical: alerts.filter((alert) => alert.severity === "critical")
        .length,
      warning: alerts.filter((alert) => alert.severity === "warning")
        .length,
      info: alerts.filter((alert) => alert.severity === "info").length,
    }),
    [alerts]
  );

  const visible =
    filter === "all"
      ? alerts
      : alerts.filter((alert) => alert.severity === filter);

  return (
    <>
      <div className="fp-alert-kpis">
        <AlertKpi
          label="Needs Attention"
          value={counts.critical}
          tone="critical"
        />
        <AlertKpi
          label="Due Soon"
          value={counts.warning}
          tone="warning"
        />
        <AlertKpi
          label="Upcoming"
          value={counts.info}
          tone="info"
        />
        <AlertKpi
          label="Total Alerts"
          value={counts.all}
          tone="all"
        />
      </div>

      <section className="fp-panel fp-alert-center">
        <div className="fp-alert-filterbar">
          <FilterButton
            label="All"
            count={counts.all}
            active={filter === "all"}
            onClick={() => setFilter("all")}
          />
          <FilterButton
            label="Critical"
            count={counts.critical}
            active={filter === "critical"}
            onClick={() => setFilter("critical")}
          />
          <FilterButton
            label="Due Soon"
            count={counts.warning}
            active={filter === "warning"}
            onClick={() => setFilter("warning")}
          />
          <FilterButton
            label="Upcoming"
            count={counts.info}
            active={filter === "info"}
            onClick={() => setFilter("info")}
          />
        </div>

        <div className="fp-alert-list">
          {visible.map((alert) => (
            <Link
              key={alert.id}
              href={alert.href}
              className={`fp-alert-row ${alert.severity}`}
            >
              <span className="fp-alert-icon">
                {alert.severity === "critical"
                  ? "!"
                  : alert.severity === "warning"
                    ? "⌛"
                    : "i"}
              </span>

              <div className="fp-alert-content">
                <div>
                  <strong>{alert.title}</strong>
                  <span className={`fp-alert-pill ${alert.category}`}>
                    {categoryLabel(alert.category)}
                  </span>
                </div>
                <p>{alert.description}</p>
              </div>

              <div className="fp-alert-date">
                {alert.dateLabel || "Now"}
                <b>›</b>
              </div>
            </Link>
          ))}
        </div>

        {visible.length === 0 && (
          <div className="fp-alert-empty">
            <div>✓</div>
            <strong>No alerts in this category.</strong>
            <span>
              MileVoxa will surface operational items here when they need
              attention.
            </span>
          </div>
        )}
      </section>
    </>
  );
}

function AlertKpi({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <div className={`fp-alert-kpi ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function FilterButton({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button className={active ? "active" : ""} onClick={onClick}>
      {label} <b>{count}</b>
    </button>
  );
}

function categoryLabel(category: MileVoxaAlert["category"]) {
  if (category === "maintenance") return "Maintenance";
  if (category === "documents") return "Documents";
  return "Loads";
}
