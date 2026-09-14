"use client";

import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type LoadRow = {
  loadNumber: string;
  route: string;
  pickupDate: string;
  miles: number;
  revenue: number;
};

type CostRow = {
  date: string;
  category: string;
  vendor: string;
  description: string;
  amount: number;
};

type ReimbursementRow = {
  date: string;
  type: string;
  category: string;
  reference: string;
  amount: number;
};

type Summary = {
  companyName: string;
  weekLabel: string;
  weekStart: string;
  grossRevenue: number;
  totalMiles: number;
  variableExpenses: number;
  reimbursements: number;
  fixedExpenses: number;
  revenueFee: number;
  mileageFee: number;
  totalExpenses: number;
  netProfit: number;
  revenuePerMile: number;
  costPerMile: number;
  profitPerMile: number;
  profitMargin: number;
  deadheadPercent: number;
  fuelCost: number;
};

export default function SettlementQuickActions({
  summary,
  loads,
  costs,
  reimbursements,
}: {
  summary: Summary;
  loads: LoadRow[];
  costs: CostRow[];
  reimbursements: ReimbursementRow[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [issuesOpen, setIssuesOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const costTotal = useMemo(
    () => costs.reduce((sum, row) => sum + row.amount, 0),
    [costs]
  );

  const weekIssues = useMemo(() => {
    const issues: {
      tone: "warning" | "danger" | "info";
      title: string;
      detail: string;
    }[] = [];

    const zeroMileLoads = loads.filter((row) => row.miles <= 0);
    if (zeroMileLoads.length > 0) {
      issues.push({
        tone: "warning",
        title: `${zeroMileLoads.length} load${zeroMileLoads.length === 1 ? "" : "s"} with no miles`,
        detail: "Review loaded/deadhead mileage before finalizing settlement.",
      });
    }

    const zeroRevenueLoads = loads.filter((row) => row.revenue <= 0);
    if (zeroRevenueLoads.length > 0) {
      issues.push({
        tone: "danger",
        title: `${zeroRevenueLoads.length} load${zeroRevenueLoads.length === 1 ? "" : "s"} with no revenue`,
        detail: "A missing rate can make weekly profit inaccurate.",
      });
    }

    if (summary.netProfit < 0) {
      issues.push({
        tone: "danger",
        title: "Negative weekly profit",
        detail: `This week is currently ${usd(Math.abs(summary.netProfit))} below break-even.`,
      });
    }

    if (summary.deadheadPercent > 20) {
      issues.push({
        tone: "warning",
        title: "Deadhead is above 20%",
        detail: `${summary.deadheadPercent.toFixed(1)}% of weekly load miles are deadhead.`,
      });
    }

    if (
      summary.grossRevenue > 0 &&
      summary.totalExpenses / summary.grossRevenue > 0.8
    ) {
      issues.push({
        tone: "warning",
        title: "Costs are consuming most revenue",
        detail: `${((summary.totalExpenses / summary.grossRevenue) * 100).toFixed(0)}% of gross revenue is going to weekly costs.`,
      });
    }

    if (
      summary.variableExpenses > 0 &&
      summary.fuelCost / summary.variableExpenses > 0.75
    ) {
      issues.push({
        tone: "info",
        title: "Fuel dominates variable expenses",
        detail: `${((summary.fuelCost / summary.variableExpenses) * 100).toFixed(0)}% of variable costs are fuel-related.`,
      });
    }

    if (summary.totalMiles > 0 && summary.revenuePerMile < 1.5) {
      issues.push({
        tone: "warning",
        title: "Revenue per mile is low",
        detail: `Weekly revenue per mile is ${usd(summary.revenuePerMile)}.`,
      });
    }

    return issues;
  }, [loads, summary]);

  function switchTab(tab: "loads" | "costs" | "reimbursements") {
    const params = new URLSearchParams(searchParams.toString());

    if (tab === "loads") params.delete("tab");
    else params.set("tab", tab);

    params.delete("q");
    params.delete("status");
    params.delete("sort");
    params.delete("minAmount");
    params.delete("maxAmount");

    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });

    window.setTimeout(() => {
      document
        .querySelector(".fp-settle-table-card")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  }

  function exportPdf() {
    setExporting(true);

    try {
      const lines: string[] = [
        "FLEETPILOT WEEKLY SETTLEMENT",
        summary.companyName || "FleetPilot Company",
        `Week: ${summary.weekLabel}`,
        "",
        "WEEKLY SUMMARY",
        `Gross Revenue: ${usd(summary.grossRevenue)}`,
        `Total Miles: ${integer(summary.totalMiles)} mi`,
        `Variable Expenses: ${usd(summary.variableExpenses)}`,
        `Reimbursements: ${usd(summary.reimbursements)}`,
        `Fixed Expenses: ${usd(summary.fixedExpenses)}`,
        `Revenue Fee: ${usd(summary.revenueFee)}`,
        `Mileage Fee: ${usd(summary.mileageFee)}`,
        `Total Expenses: ${usd(summary.totalExpenses)}`,
        `Net Profit: ${usd(summary.netProfit)}`,
        `Revenue / Mile: ${usd(summary.revenuePerMile)}`,
        `Cost / Mile: ${usd(summary.costPerMile)}`,
        `Profit / Mile: ${usd(summary.profitPerMile)}`,
        `Profit Margin: ${summary.profitMargin.toFixed(1)}%`,
        `Deadhead: ${summary.deadheadPercent.toFixed(1)}%`,
        `Fuel Cost: ${usd(summary.fuelCost)}`,
        "",
        `LOADS (${loads.length})`,
      ];

      for (const row of loads) {
        lines.push(
          `${row.loadNumber} | ${row.pickupDate} | ${row.route}`,
          `  ${integer(row.miles)} mi | ${usd(row.revenue)}`
        );
      }

      lines.push("", `WEEK COSTS (${costs.length})`);
      for (const row of costs) {
        lines.push(
          `${row.date} | ${row.category} | ${row.vendor || "No vendor"} | ${usd(row.amount)}`,
          `  ${row.description || "Business expense"}`
        );
      }

      lines.push(
        "",
        `REIMBURSEMENTS (${reimbursements.length})`
      );
      for (const row of reimbursements) {
        lines.push(
          `${row.date} | ${row.type} | ${row.category} | ${usd(row.amount)}`,
          `  ${row.reference || "Reimbursement"}`
        );
      }

      lines.push(
        "",
        "Generated by FleetPilot",
        "Weekly settlement values reflect the selected settlement week."
      );

      const blob = buildSimplePdf(lines);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `fleetpilot-settlement-${summary.weekStart}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } finally {
      window.setTimeout(() => setExporting(false), 250);
    }
  }

  return (
    <>
      <div className="mt-3 grid gap-2">
        <Action
          primary
          icon="summary"
          label="Weekly Summary"
          onClick={() => setSummaryOpen(true)}
        />
        <Action
          icon="costs"
          label="Review Week Costs"
          onClick={() => switchTab("costs")}
        />
        <Action
          icon="issues"
          label="Check Week Issues"
          onClick={() => setIssuesOpen(true)}
        />
        <Action
          icon="reimbursement"
          label="Week Reimbursements"
          onClick={() => switchTab("reimbursements")}
        />
      </div>

      {summaryOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fp-settle-summary-backdrop">
            <div className="fp-settle-summary-modal">
              <header>
                <div>
                  <span>WEEKLY SETTLEMENT</span>
                  <h2>{summary.weekLabel}</h2>
                  <p>
                    A focused review of the selected week's operating result.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSummaryOpen(false)}
                  aria-label="Close weekly summary"
                >
                  ×
                </button>
              </header>

              <div className="fp-settle-summary-hero">
                <div>
                  <span>Gross Revenue</span>
                  <strong>{usd(summary.grossRevenue)}</strong>
                </div>
                <div>
                  <span>Total Expenses</span>
                  <strong>{usd(summary.totalExpenses)}</strong>
                </div>
                <div className={summary.netProfit >= 0 ? "profit" : "loss"}>
                  <span>Net Profit</span>
                  <strong>{usd(summary.netProfit)}</strong>
                </div>
              </div>

              <div className="fp-settle-summary-grid">
                <SummaryLine label="Total Miles" value={`${integer(summary.totalMiles)} mi`} />
                <SummaryLine label="Fuel Cost" value={usd(summary.fuelCost)} />
                <SummaryLine label="Variable Expenses" value={usd(summary.variableExpenses)} />
                <SummaryLine label="Reimbursements" value={usd(summary.reimbursements)} positive />
                <SummaryLine label="Fixed Expenses" value={usd(summary.fixedExpenses)} />
                <SummaryLine label="Company Fees" value={usd(summary.revenueFee + summary.mileageFee)} />
                <SummaryLine label="Revenue / Mile" value={usd(summary.revenuePerMile)} />
                <SummaryLine label="Cost / Mile" value={usd(summary.costPerMile)} />
                <SummaryLine label="Profit / Mile" value={usd(summary.profitPerMile)} positive={summary.profitPerMile >= 0} />
                <SummaryLine label="Profit Margin" value={`${summary.profitMargin.toFixed(1)}%`} positive={summary.profitMargin >= 0} />
                <SummaryLine label="Deadhead" value={`${summary.deadheadPercent.toFixed(1)}%`} />
                <SummaryLine label="Loads" value={`${loads.length}`} />
              </div>

              <footer>
                <button
                  type="button"
                  onClick={() => switchTab("costs")}
                >
                  Review Week Costs
                </button>
                <button
                  type="button"
                  className="primary"
                  onClick={exportPdf}
                  disabled={exporting}
                >
                  {exporting ? "Preparing..." : "Export Weekly PDF"}
                </button>
              </footer>
            </div>
          </div>,
          document.body
        )}

      {issuesOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fp-settle-summary-backdrop">
            <div className="fp-settle-issues-modal">
              <header>
                <div>
                  <span>WEEK REVIEW</span>
                  <h2>Check Week Issues</h2>
                  <p>{summary.weekLabel}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIssuesOpen(false)}
                  aria-label="Close week issues"
                >
                  ×
                </button>
              </header>

              <div className="fp-settle-issues-body">
                {weekIssues.length === 0 ? (
                  <div className="fp-settle-no-issues">
                    <div>✓</div>
                    <strong>No major issues detected</strong>
                    <p>
                      FleetPilot did not find any obvious settlement problems
                      in the selected week.
                    </p>
                  </div>
                ) : (
                  weekIssues.map((issue, index) => (
                    <div
                      key={`${issue.title}-${index}`}
                      className={`fp-settle-issue-row ${issue.tone}`}
                    >
                      <span className="fp-settle-issue-dot" />
                      <div>
                        <strong>{issue.title}</strong>
                        <p>{issue.detail}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <footer>
                <button
                  type="button"
                  onClick={() => setIssuesOpen(false)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="primary"
                  onClick={() => {
                    setIssuesOpen(false);
                    setSummaryOpen(true);
                  }}
                >
                  Open Weekly Summary
                </button>
              </footer>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

function Action({
  primary = false,
  icon,
  label,
  onClick,
  disabled = false,
}: {
  primary?: boolean;
  icon: "summary" | "costs" | "issues" | "reimbursement";
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className={`fp-settle-side-action fp-settle-week-action ${
        primary ? "primary" : ""
      }`}
      onClick={onClick}
      disabled={disabled}
    >
      <span className="fp-settle-side-icon">
        <ActionIcon type={icon} />
      </span>
      <span className="fp-settle-week-action-label">{label}</span>
      <span>›</span>
    </button>
  );
}

function SummaryLine({
  label,
  value,
  positive = false,
}: {
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div className="fp-settle-summary-line">
      <span>{label}</span>
      <strong className={positive ? "positive" : ""}>{value}</strong>
    </div>
  );
}

function ActionIcon({
  type,
}: {
  type: "summary" | "costs" | "issues" | "reimbursement";
}) {
  const common = {
    viewBox: "0 0 24 24",
    className: "h-[14px] w-[14px] fill-none stroke-current",
    strokeWidth: 1.8,
  };

  if (type === "summary") {
    return (
      <svg {...common}>
        <rect x="5" y="3" width="14" height="18" rx="2" />
        <path d="M8 8h8M8 12h3M14 12h2M8 16h3M14 16h2" />
      </svg>
    );
  }

  if (type === "costs") {
    return (
      <svg {...common}>
        <path d="M5 5h14v14H5z" />
        <path d="M8 9h8M8 13h5M8 17h3" />
      </svg>
    );
  }

  if (type === "issues") {
    return (
      <svg {...common}>
        <path d="m12 3 9 16H3L12 3Z" />
        <path d="M12 9v4M12 16h.01" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="M4 6h16v12H4z" />
      <path d="M16 10h5v4h-5a2 2 0 0 1 0-4Z" />
    </svg>
  );
}

function usd(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value || 0);
}

function integer(value: number) {
  return Math.round(value || 0).toLocaleString("en-US");
}

function buildSimplePdf(sourceLines: string[]) {
  const lines = sourceLines.flatMap((line) => wrapText(String(line ?? ""), 88));
  const linesPerPage = 49;
  const pages: string[][] = [];

  for (let index = 0; index < lines.length; index += linesPerPage) {
    pages.push(lines.slice(index, index + linesPerPage));
  }

  if (!pages.length) pages.push(["FleetPilot Weekly Settlement"]);

  const objects: string[] = [];
  const pageIds: number[] = [];
  const contentIds: number[] = [];

  // Object 1: catalog, Object 2: pages tree, Object 3: built-in font
  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";

  let nextId = 4;

  for (const pageLines of pages) {
    const pageId = nextId++;
    const contentId = nextId++;
    pageIds.push(pageId);
    contentIds.push(contentId);

    objects[pageId] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] ` +
      `/Resources << /Font << /F1 3 0 R >> >> /Contents ${contentId} 0 R >>`;

    const body = [
      "BT",
      "/F1 9 Tf",
      "44 748 Td",
      ...pageLines.flatMap((line, lineIndex) => {
        const escaped = pdfEscape(line);
        if (lineIndex === 0) return [`(${escaped}) Tj`];
        return ["0 -14 Td", `(${escaped}) Tj`];
      }),
      "ET",
    ].join("\n");

    objects[contentId] =
      `<< /Length ${byteLength(body)} >>\nstream\n${body}\nendstream`;
  }

  objects[2] =
    `<< /Type /Pages /Count ${pageIds.length} /Kids [` +
    pageIds.map((id) => `${id} 0 R`).join(" ") +
    "] >>";

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];

  for (let id = 1; id < objects.length; id += 1) {
    if (!objects[id]) continue;
    offsets[id] = byteLength(pdf);
    pdf += `${id} 0 obj\n${objects[id]}\nendobj\n`;
  }

  const xrefOffset = byteLength(pdf);
  const maxId = objects.length - 1;

  pdf += `xref\n0 ${maxId + 1}\n`;
  pdf += "0000000000 65535 f \n";

  for (let id = 1; id <= maxId; id += 1) {
    const offset = offsets[id] || 0;
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  }

  pdf +=
    `trailer\n<< /Size ${maxId + 1} /Root 1 0 R >>\n` +
    `startxref\n${xrefOffset}\n%%EOF`;

  return new Blob([pdf], { type: "application/pdf" });
}

function wrapText(value: string, max: number) {
  if (!value) return [""];
  if (value.length <= max) return [value];

  const words = value.split(/\s+/);
  const output: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= max) {
      current = next;
    } else {
      if (current) output.push(current);
      current = word;
    }
  }

  if (current) output.push(current);
  return output.length ? output : [value.slice(0, max)];
}

function pdfEscape(value: string) {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll("(", "\\(")
    .replaceAll(")", "\\)")
    .replace(/[^\x20-\x7E]/g, "-");
}

function byteLength(value: string) {
  return new TextEncoder().encode(value).length;
}
