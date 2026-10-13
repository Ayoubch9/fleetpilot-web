import Image from "next/image";

const navigationGroups = [
  ["Dashboard", "Loads", "Load Decision", "Trucks", "Expenses", "Maintenance", "Reimbursements"],
  ["Weekly Settlement", "Weekly Odometer", "Security Deposit", "Fuel Analytics"],
  ["Reports", "Pilot AI", "Documents"],
];

const chartBars = [34, 52, 43, 68, 50, 78, 59, 88, 64, 73, 48, 82];

export default function Loading() {
  return (
    <main
      className="mv-route-loading"
      role="status"
      aria-live="polite"
      aria-label="Loading MileVoxa page"
      aria-busy="true"
    >
      <span className="mv-route-loading-announcement">Loading your MileVoxa workspace</span>

      <aside className="mv-route-loading-sidebar" aria-hidden="true">
        <div className="mv-route-loading-brand">
          <Image
            src="/branding/milevoxa-logo-full.png"
            width={2000}
            height={445}
            alt=""
            unoptimized
          />
        </div>
        {navigationGroups.map((group, groupIndex) => (
          <div className="mv-route-loading-nav-group" key={groupIndex}>
            {groupIndex > 0 && <span className="mv-route-loading-nav-heading" />}
            {group.map((_, itemIndex) => (
              <div
                className={`mv-route-loading-nav-row${groupIndex === 0 && itemIndex === 0 ? " is-current" : ""}`}
                key={`${groupIndex}-${itemIndex}`}
              >
                <span className="mv-route-loading-nav-icon" />
                <span className="mv-route-loading-nav-label" />
              </div>
            ))}
          </div>
        ))}
        <div className="mv-route-loading-sidebar-footer">
          <span className="mv-route-loading-nav-icon" />
          <span className="mv-route-loading-nav-label" />
        </div>
      </aside>

      <section className="mv-route-loading-workspace" aria-hidden="true">
        <header className="mv-route-loading-header">
          <div className="mv-route-loading-mobile-brand">
            <Image
              src="/branding/milevoxa-logo-horizontal.png"
              width={2000}
              height={445}
              alt=""
              unoptimized
            />
          </div>
          <div className="mv-route-loading-search">
            <span />
            <i />
          </div>
          <div className="mv-route-loading-header-actions">
            <span className="mv-route-loading-beta" />
            <span className="mv-route-loading-bell" />
            <span className="mv-route-loading-avatar" />
            <span className="mv-route-loading-account-lines"><i /><i /></span>
          </div>
        </header>

        <div className="mv-route-loading-content">
          <div className="mv-route-loading-page-heading">
            <div>
              <span className="mv-route-loading-eyebrow" />
              <span className="mv-route-loading-title" />
              <span className="mv-route-loading-description" />
            </div>
            <div className="mv-route-loading-status">
              <span className="mv-route-loading-status-dot" />
              Opening your workspace
            </div>
          </div>

          <div className="mv-route-loading-overview">
            <div className="mv-route-loading-overview-top">
              <span className="mv-route-loading-section-title" />
              <span className="mv-route-loading-section-caption" />
              <span className="mv-route-loading-action" />
            </div>
            <div className="mv-route-loading-kpis">
              {Array.from({ length: 4 }).map((_, index) => (
                <div className="mv-route-loading-kpi" key={index}>
                  <span className="mv-route-loading-kpi-label" />
                  <span className="mv-route-loading-kpi-value" />
                  <span className="mv-route-loading-kpi-note" />
                </div>
              ))}
            </div>
          </div>

          <div className="mv-route-loading-dashboard-grid">
            <section className="mv-route-loading-panel mv-route-loading-activity">
              <div className="mv-route-loading-panel-heading">
                <div><span /><i /></div>
                <span className="mv-route-loading-filter" />
              </div>
              <div className="mv-route-loading-chart">
                <div className="mv-route-loading-chart-grid"><i /><i /><i /><i /></div>
                <div className="mv-route-loading-chart-bars">
                  {chartBars.map((height, index) => (
                    <i key={index} style={{ height: `${height}%` }} />
                  ))}
                </div>
              </div>
              <div className="mv-route-loading-chart-legend"><i /><span /><i /><span /></div>
            </section>

            <section className="mv-route-loading-panel mv-route-loading-side-panel">
              <div className="mv-route-loading-panel-heading">
                <div><span /><i /></div>
                <span className="mv-route-loading-dots" />
              </div>
              {Array.from({ length: 4 }).map((_, index) => (
                <div className="mv-route-loading-list-row" key={index}>
                  <span className="mv-route-loading-list-mark" />
                  <div><i /><i /></div>
                  <b />
                </div>
              ))}
            </section>

            <section className="mv-route-loading-panel mv-route-loading-table">
              <div className="mv-route-loading-panel-heading">
                <div><span /><i /></div>
                <span className="mv-route-loading-filter" />
              </div>
              <div className="mv-route-loading-table-head"><i /><i /><i /><i /></div>
              {Array.from({ length: 4 }).map((_, index) => (
                <div className="mv-route-loading-table-row" key={index}>
                  <i /><i /><i /><i />
                </div>
              ))}
            </section>
          </div>
        </div>
        <nav className="mv-route-loading-mobile-nav" aria-hidden="true">
          {Array.from({ length: 5 }).map((_, index) => (
            <span className={index === 0 ? "is-current" : ""} key={index}>
              <i />
              <b />
            </span>
          ))}
        </nav>
      </section>
    </main>
  );
}
