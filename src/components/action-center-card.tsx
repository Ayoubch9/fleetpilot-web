import Link from "next/link";
import type { ActionAlert } from "@/lib/action-center";
import { setAlertState } from "@/app/action-center/actions";

function badge(severity: ActionAlert["severity"]) {
  return severity === "critical" ? "Critical" : severity === "warning" ? "Warning" : "Attention";
}

export function ActionCenterCard({ alerts, stateAvailable = true, compact = false }: { alerts: ActionAlert[]; stateAvailable?: boolean; compact?: boolean }) {
  const shown = compact ? alerts.slice(0, 5) : alerts;
  const critical = alerts.filter((a) => a.severity === "critical").length;
  const warnings = alerts.filter((a) => a.severity === "warning").length;
  const attention = alerts.filter((a) => a.severity === "attention").length;
  const attentionCopy = alerts.length
    ? `${alerts.length} item${alerts.length === 1 ? "" : "s"} need your attention`
    : "No urgent business items need your attention.";

  return <section className={`fp-action-center ${compact ? "compact" : ""}`}>
    <header className="fp-action-center-head">
      <div className="fp-action-head-copy">
        <span className="fp-overline">Business Attention</span>
        <div className="fp-action-title-row">
          <h2>Action Center</h2>
          <p>{compact ? (alerts.length ? `(${attentionCopy})` : "(No urgent items)") : attentionCopy}</p>
        </div>
      </div>

      {compact ? <div className="fp-action-head-right">
        {alerts.length > 0 && <div className="fp-action-summary fp-action-summary--inline">
          {critical > 0 && <span className="critical">{critical} Critical</span>}
          {warnings > 0 && <span className="warning">{warnings} Warning{warnings === 1 ? "" : "s"}</span>}
          {attention > 0 && <span className="attention">{attention} Attention</span>}
        </div>}
        <Link href="/action-center" className="fp-action-view-all">View All <span aria-hidden="true">→</span></Link>
      </div> : null}
    </header>

    {!compact && alerts.length > 0 && <div className="fp-action-summary">
      <span className="critical">{critical} Critical</span>
      <span className="warning">{warnings} Warning{warnings === 1 ? "" : "s"}</span>
      <span className="attention">{attention} Attention</span>
    </div>}

    {!stateAvailable && <div className="fp-action-setup">Run <b>supabase_action_center_v4_5_0.sql</b> to enable Snooze and Acknowledge controls.</div>}

    <div className="fp-action-list">
      {shown.length === 0 ? <div className="fp-action-empty"><b>✓ You&apos;re all caught up</b><span>We&apos;ll surface maintenance and document issues here when they need attention.</span></div> : shown.map((alert) => <article className={`fp-action-item ${alert.severity}`} key={alert.key}>
        <div className="fp-action-severity"><span>{badge(alert.severity)}</span></div>
        <div className="fp-action-copy"><b>{alert.title}</b><span>{alert.context}</span><p>{alert.description}</p></div>
        <div className="fp-action-buttons"><Link href={alert.href}>View</Link>{stateAvailable && <form action={setAlertState}><input type="hidden" name="alertKey" value={alert.key}/><input type="hidden" name="sourceType" value={alert.sourceType}/><input type="hidden" name="sourceId" value={alert.sourceId}/><button name="action" value="snooze:1">Remind Tomorrow</button>{alert.severity !== "critical" && <button name="action" value="acknowledge">Acknowledge</button>}</form>}</div>
      </article>)}
    </div>
  </section>;
}
