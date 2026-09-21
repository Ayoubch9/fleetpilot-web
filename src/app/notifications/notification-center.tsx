"use client";
import AppTabs from "@/components/app-tabs";
import KpiTile from "@/components/kpi-tile";

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
        <KpiTile label="Needs Attention" value={counts.critical} />
        <KpiTile label="Due Soon" value={counts.warning} />
        <KpiTile label="Upcoming" value={counts.info} />
        <KpiTile label="Total Alerts" value={counts.all} />
      </div>

      <section className="fp-panel fp-alert-center">
        <AppTabs
          activeKey={filter}
          ariaLabel="Notification severity"
          items={[
            { key: "all", label: "All", count: counts.all },
            { key: "critical", label: "Critical", count: counts.critical },
            { key: "warning", label: "Due Soon", count: counts.warning },
            { key: "info", label: "Upcoming", count: counts.info },
          ]}
          onChange={(key) => setFilter(key as Filter)}
        />

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



function categoryLabel(category: MileVoxaAlert["category"]) {
  if (category === "maintenance") return "Maintenance";
  if (category === "documents") return "Documents";
  return "Loads";
}
