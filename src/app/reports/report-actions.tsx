"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

type TruckOption = {
  id: string;
  unit: string;
};

export default function ReportActions({
  trucks,
  companyName,
  periodLabel,
  exportRows,
}: {
  trucks: TruckOption[];
  companyName: string;
  periodLabel: string;
  exportRows: string[][];
}) {
  const router = useRouter();
  const [customOpen, setCustomOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [customTruck, setCustomTruck] = useState("all");
  const [customError, setCustomError] = useState("");

  const [frequency, setFrequency] = useState("weekly");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleError, setScheduleError] = useState("");
  const [exportingPdf, setExportingPdf] = useState(false);

  async function exportPdf() {
    setExportingPdf(true);

    try {
      const report = buildReportPdfData(
        companyName,
        periodLabel,
        exportRows
      );
      const logo = await loadPdfLogo();

      const blob = buildDesignedReportPdf(report, logo);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `milevoxa-business-report-${safeFilePart(periodLabel)}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } finally {
      window.setTimeout(() => setExportingPdf(false), 250);
    }
  }

  function exportCsv() {
    downloadCsv(
      `milevoxa-business-report-${new Date().toISOString().slice(0, 10)}.csv`,
      exportRows
    );
  }

  function applyCustomReport() {
    setCustomError("");

    if (!customFrom || !customTo) {
      setCustomError("Choose both From and To dates.");
      return;
    }

    if (customFrom > customTo) {
      setCustomError("From date cannot be after To date.");
      return;
    }

    const params = new URLSearchParams();
    params.set("period", "custom");
    params.set("from", customFrom);
    params.set("to", customTo);

    if (customTruck !== "all") {
      params.set("truck", customTruck);
    }

    router.push(`/reports?${params.toString()}`);
    setCustomOpen(false);
  }

  function downloadSchedule() {
    setScheduleError("");

    if (!scheduleDate) {
      setScheduleError("Choose the first reminder date.");
      return;
    }

    const start = scheduleDate.replaceAll("-", "");
    const rule =
      frequency === "monthly"
        ? "RRULE:FREQ=MONTHLY"
        : frequency === "yearly"
          ? "RRULE:FREQ=YEARLY"
          : "RRULE:FREQ=WEEKLY";

    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//MileVoxa//Reports//EN",
      "BEGIN:VEVENT",
      `DTSTART;VALUE=DATE:${start}`,
      rule,
      "SUMMARY:Review MileVoxa Business Report",
      `DESCRIPTION:Open MileVoxa Reports and review ${escapeIcs(periodLabel)}.`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const url = URL.createObjectURL(
      new Blob([ics], { type: "text/calendar;charset=utf-8" })
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "milevoxa-report-schedule.ics";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setScheduleOpen(false);
  }

  return (
    <>
      <div className="fp-report-header-actions">
        <button
          type="button"
          className="primary"
          onClick={exportPdf}
          disabled={exportingPdf}
        >
          {exportingPdf ? "Preparing PDF..." : "Export PDF"}
        </button>
        <button type="button" onClick={exportCsv}>
          Export CSV
        </button>
        <button type="button" onClick={() => setCustomOpen(true)}>
          Custom Report
        </button>
        <button type="button" onClick={() => setScheduleOpen(true)}>
          Schedule Report
        </button>
      </div>

      {customOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fp-report-modal-backdrop">
            <div className="fp-report-modal">
              <header>
                <div>
                  <span>CUSTOM REPORT</span>
                  <h2>Choose any reporting range</h2>
                  <p>
                    Select any From and To dates. An 11-day range will show
                    and export exactly those 11 calendar days.
                  </p>
                </div>
                <button type="button" onClick={() => setCustomOpen(false)}>
                  ×
                </button>
              </header>

              <div className="fp-report-modal-body">
                <div className="fp-report-modal-grid">
                  <label>
                    <span>From *</span>
                    <input
                      type="date"
                      value={customFrom}
                      onChange={(event) => setCustomFrom(event.target.value)}
                    />
                  </label>

                  <label>
                    <span>To *</span>
                    <input
                      type="date"
                      min={customFrom || undefined}
                      value={customTo}
                      onChange={(event) => setCustomTo(event.target.value)}
                    />
                  </label>
                </div>

                <label>
                  <span>Truck</span>
                  <select
                    value={customTruck}
                    onChange={(event) => setCustomTruck(event.target.value)}
                  >
                    <option value="all">All Trucks</option>
                    {trucks.map((truck) => (
                      <option value={truck.id} key={truck.id}>
                        Truck #{truck.unit}
                      </option>
                    ))}
                  </select>
                </label>

                {customError && (
                  <div className="fp-report-modal-error">{customError}</div>
                )}
              </div>

              <footer>
                <button type="button" onClick={() => setCustomOpen(false)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="primary"
                  onClick={applyCustomReport}
                >
                  Run Custom Report
                </button>
              </footer>
            </div>
          </div>,
          document.body
        )}

      {scheduleOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fp-report-modal-backdrop">
            <div className="fp-report-modal">
              <header>
                <div>
                  <span>SCHEDULE REPORT</span>
                  <h2>Create a recurring report reminder</h2>
                  <p>
                    Download a calendar reminder for reviewing your MileVoxa report.
                    Automatic emailed reports are not enabled yet.
                  </p>
                </div>
                <button type="button" onClick={() => setScheduleOpen(false)}>
                  ×
                </button>
              </header>

              <div className="fp-report-modal-body">
                <label>
                  <span>Frequency</span>
                  <select
                    value={frequency}
                    onChange={(event) => setFrequency(event.target.value)}
                  >
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </label>

                <label>
                  <span>First reminder date *</span>
                  <input
                    type="date"
                    value={scheduleDate}
                    onChange={(event) => setScheduleDate(event.target.value)}
                  />
                </label>

                {scheduleError && (
                  <div className="fp-report-modal-error">{scheduleError}</div>
                )}
              </div>

              <footer>
                <button type="button" onClick={() => setScheduleOpen(false)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="primary"
                  onClick={downloadSchedule}
                >
                  Download Calendar Schedule
                </button>
              </footer>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

function downloadCsv(fileName: string, rows: string[][]) {
  const csv = rows
    .map((row) =>
      row
        .map((cell) => `"${String(cell).replaceAll('"', '""')}"`)
        .join(",")
    )
    .join("\r\n");

  const url = URL.createObjectURL(
    new Blob([csv], { type: "text/csv;charset=utf-8" })
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function escapeIcs(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}



type PdfSummaryItem = { label: string; value: string };
type PdfDailyRow = {
  date: string;
  revenue: string;
  variable: string;
  reimbursements: string;
  fixed: string;
  revenueFee: string;
  odometerFee: string;
  totalCosts: string;
  netProfit: string;
  loads: string;
  miles: string;
  maintenance: string;
};
type PdfTruckRow = {
  truck: string;
  revenue: string;
  expenses: string;
  profit: string;
  miles: string;
  completedLoads: string;
};
type PdfReportData = {
  companyName: string;
  periodLabel: string;
  summary: PdfSummaryItem[];
  daily: PdfDailyRow[];
  trucks: PdfTruckRow[];
};

function buildReportPdfData(
  companyName: string,
  periodLabel: string,
  rows: string[][]
): PdfReportData {
  const firstBlank = rows.findIndex((row) => row.length === 0);
  const summaryRows =
    firstBlank >= 0 ? rows.slice(2, firstBlank) : rows.slice(2);

  const summary = summaryRows
    .filter((row) => row.length > 0)
    .map((row) => ({ label: row[0] || "", value: row[1] || "" }));

  const dayHeadingIndex = rows.findIndex((row) => row[0] === "Day-by-Day");
  const daily: PdfDailyRow[] = [];
  if (dayHeadingIndex >= 0) {
    for (
      let index = dayHeadingIndex + 1;
      index < rows.length && rows[index].length > 0;
      index += 1
    ) {
      const row = rows[index];
      daily.push({
        date: row[0] || "",
        revenue: row[1] || "0",
        variable: row[2] || "0",
        reimbursements: row[3] || "0",
        fixed: row[4] || "0",
        revenueFee: row[5] || "0",
        odometerFee: row[6] || "0",
        totalCosts: row[7] || "0",
        netProfit: row[8] || "0",
        loads: row[9] || "0",
        miles: row[10] || "0",
        maintenance: row[11] || "0",
      });
    }
  }

  const truckHeadingIndex = rows.findIndex((row) => row[0] === "Truck");
  const trucks: PdfTruckRow[] = [];
  if (truckHeadingIndex >= 0) {
    for (
      let index = truckHeadingIndex + 1;
      index < rows.length;
      index += 1
    ) {
      const row = rows[index];
      if (!row.length) continue;
      trucks.push({
        truck: row[0] || "",
        revenue: row[1] || "0",
        expenses: row[2] || "0",
        profit: row[3] || "0",
        miles: row[4] || "0",
        completedLoads: row[5] || "0",
      });
    }
  }

  return {
    companyName: companyName || "MileVoxa Company",
    periodLabel,
    summary,
    daily,
    trucks,
  };
}

function buildDesignedReportPdf(
  report: PdfReportData,
  logo: PdfJpegImage | null
) {
  const pdf = new PdfDocumentBuilder();

  if (logo) {
    pdf.registerJpeg(logo);
  }

  drawCoverSummary(pdf, report);
  drawExpenseBreakdown(pdf, report);
  drawDailyActivity(pdf, report);
  drawTruckPerformance(pdf, report);
  drawFooterOnAllPages(pdf, report);

  return pdf.toBlob();
}

function drawCoverSummary(pdf: PdfDocumentBuilder, report: PdfReportData) {
  pdf.newPage();
  pdf.fillRect(0, 0, 612, 792, [0.969, 0.976, 0.973]);
  pdf.fillRect(0, 0, 612, 104, [0.063, 0.133, 0.22]);

  drawPdfBrand(pdf, 30, 14, 220, 68);
  pdf.text("BUSINESS REPORT", 34, 94, 8, [0.65, 0.78, 0.69], true);

  pdf.text(report.companyName, 578, 46, 13, [1, 1, 1], true, "right");
  pdf.text(report.periodLabel, 578, 67, 9, [0.84, 0.88, 0.91], false, "right");

  pdf.text("Financial Overview", 34, 138, 18, [0.043, 0.09, 0.188], true);
  pdf.text(
    "Revenue, expenses, profitability and operating activity for the selected period.",
    34,
    158,
    9,
    [0.38, 0.45, 0.55]
  );

  const keyLabels = [
    "Gross Revenue",
    "Total Expenses",
    "Net Profit",
    "Completed Loads",
    "Total Miles",
    "Odometer Miles",
  ];
  const keyItems = keyLabels
    .map((label) => report.summary.find((item) => item.label === label))
    .filter(Boolean) as PdfSummaryItem[];

  const cardW = 170;
  const cardH = 78;
  const gap = 12;
  const y = 192;

  keyItems.slice(0, 6).forEach((item, index) => {
    const col = index % 3;
    const row = Math.floor(index / 3);
    const x = 34 + col * (cardW + gap);
    const cy = y + row * (cardH + gap);

    pdf.roundRect(x, cy, cardW, cardH, 10, [1, 1, 1], [0.87, 0.9, 0.93]);
    pdf.text(item.label, x + 13, cy + 20, 8, [0.38, 0.45, 0.55], true);

    const value = isMoneyLabel(item.label) ? usdText(item.value) : item.value;
    const positive =
      item.label === "Net Profit" && Number(item.value || 0) >= 0;

    pdf.text(
      value,
      x + 13,
      cy + 49,
      16,
      positive ? [0.086, 0.522, 0.231] : [0.043, 0.09, 0.188],
      true
    );
  });

  pdf.text("Business Cost Structure", 34, 380, 12, [0.043, 0.09, 0.188], true);

  const breakdownLabels = [
    "Variable Expenses",
    "Reimbursements",
    "Fixed Expenses",
    "Company Revenue Fee",
    "Odometer Mileage Fee",
    "Fuel Cost",
  ];
  const rows = breakdownLabels
    .map((label) => report.summary.find((item) => item.label === label))
    .filter(Boolean) as PdfSummaryItem[];

  rows.forEach((item, index) => {
    const rowY = 398 + index * 36;
    const shade: PdfColor =
      index % 2 === 0
        ? [0.985, 0.989, 0.987]
        : [1, 1, 1];

    pdf.fillRect(34, rowY, 544, 31, shade);
    pdf.text(item.label, 46, rowY + 19, 9, [0.043, 0.09, 0.188], true);
    pdf.text(
      usdText(item.value),
      566,
      rowY + 19,
      9,
      item.label === "Reimbursements"
        ? [0.086, 0.522, 0.231]
        : [0.043, 0.09, 0.188],
      true,
      "right"
    );
  });
}

function drawExpenseBreakdown(pdf: PdfDocumentBuilder, report: PdfReportData) {
  const labels = [
    "Variable Expenses",
    "Fixed Expenses",
    "Company Revenue Fee",
    "Odometer Mileage Fee",
    "Reimbursements",
    "Total Expenses",
    "Net Profit",
  ];

  const items = labels
    .map((label) => report.summary.find((item) => item.label === label))
    .filter(Boolean) as PdfSummaryItem[];

  pdf.newPage();
  drawPageHeader(pdf, "Expense Details", report);

  pdf.text(
    "Complete operating-cost picture used in the report calculation.",
    34,
    126,
    9,
    [0.4, 0.47, 0.56]
  );

  const maxAmount = Math.max(
    ...items
      .filter((item) => item.label !== "Net Profit")
      .map((item) => Math.abs(Number(item.value || 0))),
    1
  );

  items.forEach((item, index) => {
    const amount = Number(item.value || 0);
    const rowY = 148 + index * 62;

    pdf.roundRect(34, rowY, 544, 50, 8, [1, 1, 1], [0.88, 0.91, 0.94]);

    const accent: PdfColor =
      item.label === "Reimbursements"
        ? [0.086, 0.522, 0.231]
        : item.label === "Net Profit"
          ? amount >= 0
            ? [0.086, 0.522, 0.231]
            : [0.76, 0.2, 0.2]
          : [0.063, 0.133, 0.22];

    pdf.fillRect(34, rowY, 5, 50, accent);
    pdf.text(item.label, 50, rowY + 18, 9, [0.043, 0.09, 0.188], true);
    pdf.text(usdText(item.value), 564, rowY + 19, 10, accent, true, "right");

    const barW =
      item.label === "Net Profit"
        ? 0
        : Math.max(0, Math.min(330, (Math.abs(amount) / maxAmount) * 330));

    if (barW > 0) {
      pdf.roundRect(50, rowY + 31, 330, 6, 3, [0.94, 0.95, 0.96], null);
      pdf.roundRect(50, rowY + 31, barW, 6, 3, accent, null);
    }
  });

  pdf.roundRect(34, 602, 544, 64, 8, [0.956, 0.98, 0.96], [0.83, 0.91, 0.85]);
  pdf.text("How to read this page", 48, 622, 8, [0.086, 0.522, 0.231], true);
  pdf.text(
    "Reimbursements reduce operating expenses. Fixed expenses, company revenue fees and odometer mileage fees are included in Total Expenses.",
    48,
    641,
    8,
    [0.33, 0.42, 0.51]
  );
}

function drawDailyActivity(pdf: PdfDocumentBuilder, report: PdfReportData) {
  const rowsPerPage = 15;

  if (!report.daily.length) {
    pdf.newPage();
    drawPageHeader(pdf, "Day-by-Day Business Activity", report);
    pdf.text(
      "No daily activity was found for this reporting period.",
      34,
      140,
      10,
      [0.38, 0.45, 0.55]
    );
    return;
  }

  for (let offset = 0; offset < report.daily.length; offset += rowsPerPage) {
    const chunk = report.daily.slice(offset, offset + rowsPerPage);
    pdf.newPage();

    drawPageHeader(
      pdf,
      "Day-by-Day Business Activity",
      report,
      offset > 0 ? `Continued - ${offset + 1}-${offset + chunk.length}` : undefined
    );

    let y = 118;

    const columns = [
      { label: "DATE", x: 34, w: 76, align: "left" as const },
      { label: "REVENUE", x: 110, w: 66, align: "right" as const },
      { label: "COSTS", x: 176, w: 66, align: "right" as const },
      { label: "NET", x: 242, w: 66, align: "right" as const },
      { label: "FIXED", x: 308, w: 60, align: "right" as const },
      { label: "REV FEE", x: 368, w: 60, align: "right" as const },
      { label: "ODOMETER", x: 428, w: 68, align: "right" as const },
      { label: "LOADS", x: 496, w: 38, align: "right" as const },
      { label: "MILES", x: 534, w: 44, align: "right" as const },
    ];

    pdf.fillRect(34, y, 544, 27, [0.063, 0.133, 0.22]);

    columns.forEach((col) => {
      pdf.text(
        col.label,
        col.align === "right" ? col.x + col.w - 4 : col.x + 4,
        y + 17,
        6.5,
        [1, 1, 1],
        true,
        col.align
      );
    });

    y += 27;

    chunk.forEach((row, index) => {
      const rowY = y + index * 34;
      const bg: PdfColor =
        index % 2 === 0
          ? [1, 1, 1]
          : [0.978, 0.984, 0.981];
      pdf.fillRect(34, rowY, 544, 34, bg);

      const values = [
        row.date,
        usdText(row.revenue),
        usdText(row.totalCosts),
        usdText(row.netProfit),
        usdText(row.fixed),
        usdText(row.revenueFee),
        usdText(row.odometerFee),
        row.loads,
        row.miles,
      ];

      columns.forEach((col, colIndex) => {
        const isNet = colIndex === 3;
        const netValue = Number(row.netProfit || 0);

        pdf.text(
          values[colIndex],
          col.align === "right" ? col.x + col.w - 4 : col.x + 4,
          rowY + 20,
          colIndex === 0 ? 7.5 : 6.8,
          isNet
            ? netValue >= 0
              ? [0.086, 0.522, 0.231]
              : [0.76, 0.2, 0.2]
            : [0.15, 0.21, 0.3],
          isNet || colIndex === 0,
          col.align
        );
      });

      pdf.line(34, rowY + 34, 578, rowY + 34, [0.9, 0.92, 0.94], 0.5);
    });

    const sumRevenue = chunk.reduce(
      (sum, row) => sum + Number(row.revenue || 0),
      0
    );
    const sumCosts = chunk.reduce(
      (sum, row) => sum + Number(row.totalCosts || 0),
      0
    );
    const sumNet = chunk.reduce(
      (sum, row) => sum + Number(row.netProfit || 0),
      0
    );

    const summaryY = y + chunk.length * 34 + 14;
    pdf.roundRect(34, summaryY, 544, 54, 8, [0.956, 0.98, 0.96], [0.83, 0.91, 0.85]);
    pdf.text("PAGE TOTALS", 48, summaryY + 18, 7, [0.086, 0.522, 0.231], true);
    pdf.text(`Revenue ${usdText(String(sumRevenue))}`, 48, summaryY + 36, 8, [0.043, 0.09, 0.188], true);
    pdf.text(`Costs ${usdText(String(sumCosts))}`, 240, summaryY + 36, 8, [0.043, 0.09, 0.188], true);
    pdf.text(
      `Net ${usdText(String(sumNet))}`,
      430,
      summaryY + 36,
      8,
      sumNet >= 0 ? [0.086, 0.522, 0.231] : [0.76, 0.2, 0.2],
      true
    );
  }
}

function drawTruckPerformance(pdf: PdfDocumentBuilder, report: PdfReportData) {
  pdf.newPage();
  drawPageHeader(pdf, "Truck Performance", report);

  if (!report.trucks.length) {
    pdf.text(
      "No truck performance data was found for this reporting period.",
      34,
      140,
      10,
      [0.38, 0.45, 0.55]
    );
    return;
  }

  const columns = [
    { label: "TRUCK", x: 34, w: 90, align: "left" as const },
    { label: "REVENUE", x: 124, w: 100, align: "right" as const },
    { label: "EXPENSES", x: 224, w: 100, align: "right" as const },
    { label: "PROFIT", x: 324, w: 100, align: "right" as const },
    { label: "MILES", x: 424, w: 80, align: "right" as const },
    { label: "LOADS", x: 504, w: 74, align: "right" as const },
  ];

  let y = 122;
  pdf.fillRect(34, y, 544, 28, [0.063, 0.133, 0.22]);
  columns.forEach((col) => {
    pdf.text(
      col.label,
      col.align === "right" ? col.x + col.w - 5 : col.x + 5,
      y + 18,
      7,
      [1, 1, 1],
      true,
      col.align
    );
  });

  y += 28;

  report.trucks.forEach((row, index) => {
    const rowY = y + index * 40;
    const bg: PdfColor =
      index % 2 === 0
        ? [1, 1, 1]
        : [0.978, 0.984, 0.981];
    pdf.fillRect(34, rowY, 544, 40, bg);

    const profit = Number(row.profit || 0);
    const values = [
      row.truck,
      usdText(row.revenue),
      usdText(row.expenses),
      usdText(row.profit),
      Number(row.miles || 0).toLocaleString("en-US"),
      row.completedLoads,
    ];

    columns.forEach((col, colIndex) => {
      pdf.text(
        values[colIndex],
        col.align === "right" ? col.x + col.w - 5 : col.x + 5,
        rowY + 24,
        8,
        colIndex === 3
          ? profit >= 0
            ? [0.086, 0.522, 0.231]
            : [0.76, 0.2, 0.2]
          : [0.12, 0.18, 0.27],
        colIndex === 0 || colIndex === 3,
        col.align
      );
    });

    pdf.line(34, rowY + 40, 578, rowY + 40, [0.9, 0.92, 0.94], 0.5);
  });
}

function drawPageHeader(
  pdf: PdfDocumentBuilder,
  title: string,
  report: PdfReportData,
  subtitle?: string
) {
  pdf.fillRect(0, 0, 612, 88, [0.063, 0.133, 0.22]);
  drawPdfBrand(pdf, 30, 12, 150, 46);
  pdf.text(title, 68, 66, 10, [0.75, 0.84, 0.78], true);
  pdf.text(report.companyName, 578, 39, 10, [1, 1, 1], true, "right");
  pdf.text(
    subtitle || report.periodLabel,
    578,
    60,
    8,
    [0.84, 0.88, 0.91],
    false,
    "right"
  );
}

function drawFooterOnAllPages(pdf: PdfDocumentBuilder, report: PdfReportData) {
  pdf.pages.forEach((page, index) => {
    page.commands.push(
      lineCommand(34, 754, 578, 754, [0.86, 0.89, 0.92], 0.5),
      textCommand(
        "MileVoxa - Run your trucking business with clarity.",
        34,
        770,
        7,
        [0.48, 0.55, 0.63],
        false,
        "left"
      ),
      textCommand(
        `${report.periodLabel}  |  Page ${index + 1} of ${pdf.pages.length}`,
        578,
        770,
        7,
        [0.48, 0.55, 0.63],
        false,
        "right"
      )
    );
  });
}

type PdfJpegImage = {
  name: string;
  width: number;
  height: number;
  hex: string;
};

async function loadPdfLogo(): Promise<PdfJpegImage | null> {
  try {
    const image = await loadBrowserImage(
      "/branding/milevoxa-report-logo-full.png"
    );

    const canvas = document.createElement("canvas");
    canvas.width = 980;
    canvas.height = 300;

    const context = canvas.getContext("2d");
    if (!context) return null;

    context.fillStyle = "#102238";
    context.fillRect(0, 0, canvas.width, canvas.height);

    const paddingX = 12;
    const paddingY = 10;
    const availableWidth = canvas.width - paddingX * 2;
    const availableHeight = canvas.height - paddingY * 2;
    const scale = Math.min(
      availableWidth / image.naturalWidth,
      availableHeight / image.naturalHeight
    );
    const drawWidth = image.naturalWidth * scale;
    const drawHeight = image.naturalHeight * scale;

    context.drawImage(
      image,
      paddingX,
      (canvas.height - drawHeight) / 2,
      drawWidth,
      drawHeight
    );

    const dataUrl = canvas.toDataURL("image/jpeg", 0.94);
    const base64 = dataUrl.split(",")[1];
    if (!base64) return null;

    return {
      name: "MileVoxaLogo",
      width: canvas.width,
      height: canvas.height,
      hex: base64ToHex(base64),
    };
  } catch {
    return null;
  }
}

function loadBrowserImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load PDF logo."));
    image.src = src;
  });
}

function base64ToHex(base64: string) {
  const binary = window.atob(base64);
  let hex = "";

  for (let index = 0; index < binary.length; index += 1) {
    hex += binary.charCodeAt(index).toString(16).padStart(2, "0");
  }

  return `${hex}>`;
}

function drawPdfBrand(
  pdf: PdfDocumentBuilder,
  x: number,
  y: number,
  width: number,
  height: number
) {
  if (pdf.hasImage("MileVoxaLogo")) {
    pdf.image("MileVoxaLogo", x, y, width, height);
    return;
  }

  pdf.text(
    "MILEVOXA",
    x,
    y + height * 0.62,
    Math.max(13, height * 0.3),
    [1, 1, 1],
    true
  );
}

function isMoneyLabel(label: string) {
  return [
    "Gross Revenue",
    "Variable Expenses",
    "Reimbursements",
    "Fixed Expenses",
    "Company Revenue Fee",
    "Odometer Mileage Fee",
    "Total Expenses",
    "Net Profit",
    "Fuel Cost",
  ].includes(label);
}

function usdText(value: string | undefined) {
  const parsed = Number(value || 0);
  if (!Number.isFinite(parsed)) return value || "$0.00";

  return parsed.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });
}

function safeFilePart(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "report";
}

type PdfColor = [number, number, number];
type PdfAlign = "left" | "right" | "center";
type PdfPage = { commands: string[] };

class PdfDocumentBuilder {
  pages: PdfPage[] = [];
  private currentPage: PdfPage | null = null;
  private images = new Map<string, PdfJpegImage>();

  newPage() {
    this.currentPage = { commands: [] };
    this.pages.push(this.currentPage);
  }

  registerJpeg(image: PdfJpegImage) {
    this.images.set(image.name, image);
  }

  hasImage(name: string) {
    return this.images.has(name);
  }

  image(
    name: string,
    x: number,
    y: number,
    width: number,
    height: number
  ) {
    if (!this.images.has(name)) return;
    this.ensurePage();
    this.currentPage!.commands.push(
      imageCommand(name, x, y, width, height)
    );
  }

  text(
    value: string,
    x: number,
    y: number,
    size: number,
    color: PdfColor,
    bold = false,
    align: PdfAlign = "left"
  ) {
    this.ensurePage();
    this.currentPage!.commands.push(
      textCommand(value, x, y, size, color, bold, align)
    );
  }

  fillRect(x: number, y: number, width: number, height: number, fill: PdfColor) {
    this.ensurePage();
    this.currentPage!.commands.push(
      fillRectCommand(x, y, width, height, fill)
    );
  }

  roundRect(
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
    fill: PdfColor,
    stroke: PdfColor | null
  ) {
    this.ensurePage();
    this.currentPage!.commands.push(
      roundRectCommand(x, y, width, height, radius, fill, stroke)
    );
  }

  line(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    color: PdfColor,
    width: number
  ) {
    this.ensurePage();
    this.currentPage!.commands.push(
      lineCommand(x1, y1, x2, y2, color, width)
    );
  }

  toBlob() {
    const objects: Record<number, string> = {};
    const pageIds: number[] = [];
    const regularFontId = 3;
    const boldFontId = 4;

    objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
    objects[regularFontId] =
      "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";
    objects[boldFontId] =
      "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>";

    let nextId = 5;
    const imageObjectIds = new Map<string, number>();

    this.images.forEach((image) => {
      const imageId = nextId++;
      imageObjectIds.set(image.name, imageId);
      objects[imageId] =
        `<< /Type /XObject /Subtype /Image /Width ${image.width} ` +
        `/Height ${image.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 ` +
        `/Filter [/ASCIIHexDecode /DCTDecode] /Length ${byteLength(image.hex)} >>\n` +
        `stream\n${image.hex}\nendstream`;
    });

    const xObjects = [...imageObjectIds.entries()]
      .map(([name, id]) => `/${name} ${id} 0 R`)
      .join(" ");

    this.pages.forEach((page) => {
      const pageId = nextId++;
      const contentId = nextId++;
      pageIds.push(pageId);

      objects[pageId] =
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] ` +
        `/Resources << /Font << /F1 ${regularFontId} 0 R /F2 ${boldFontId} 0 R >> ` +
        `${xObjects ? `/XObject << ${xObjects} >> ` : ""}>> ` +
        `/Contents ${contentId} 0 R >>`;

      const body = page.commands.join("\n");
      objects[contentId] =
        `<< /Length ${byteLength(body)} >>\nstream\n${body}\nendstream`;
    });

    objects[2] =
      `<< /Type /Pages /Count ${pageIds.length} /Kids [` +
      pageIds.map((id) => `${id} 0 R`).join(" ") +
      "] >>";

    let pdf = "%PDF-1.4\n";
    const offsets: Record<number, number> = { 0: 0 };
    const maxId = Math.max(...Object.keys(objects).map(Number));

    for (let id = 1; id <= maxId; id += 1) {
      if (!objects[id]) continue;
      offsets[id] = byteLength(pdf);
      pdf += `${id} 0 obj\n${objects[id]}\nendobj\n`;
    }

    const xrefOffset = byteLength(pdf);
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

  private ensurePage() {
    if (!this.currentPage) this.newPage();
  }
}

function textCommand(
  value: string,
  x: number,
  yFromTop: number,
  size: number,
  color: PdfColor,
  bold: boolean,
  align: PdfAlign
) {
  const safe = pdfEscape(value);
  const font = bold ? "F2" : "F1";
  const y = 792 - yFromTop;
  let tx = x;

  if (align !== "left") {
    const approxWidth = safe.length * size * 0.49;
    if (align === "right") tx = x - approxWidth;
    if (align === "center") tx = x - approxWidth / 2;
  }

  return [
    "BT",
    `/${font} ${size} Tf`,
    `${color[0]} ${color[1]} ${color[2]} rg`,
    `1 0 0 1 ${tx.toFixed(2)} ${y.toFixed(2)} Tm`,
    `(${safe}) Tj`,
    "ET",
  ].join("\n");
}

function fillRectCommand(
  x: number,
  yFromTop: number,
  width: number,
  height: number,
  fill: PdfColor
) {
  const y = 792 - yFromTop - height;
  return [
    "q",
    `${fill[0]} ${fill[1]} ${fill[2]} rg`,
    `${x} ${y} ${width} ${height} re`,
    "f",
    "Q",
  ].join("\n");
}

function roundRectCommand(
  x: number,
  yFromTop: number,
  width: number,
  height: number,
  radius: number,
  fill: PdfColor,
  stroke: PdfColor | null
) {
  const y = 792 - yFromTop - height;
  const r = Math.min(radius, width / 2, height / 2);
  const k = 0.5522847498;
  const c = r * k;

  const parts = [
    "q",
    `${fill[0]} ${fill[1]} ${fill[2]} rg`,
  ];

  if (stroke) {
    parts.push(`${stroke[0]} ${stroke[1]} ${stroke[2]} RG`, "0.7 w");
  }

  parts.push(
    `${x + r} ${y} m`,
    `${x + width - r} ${y} l`,
    `${x + width - r + c} ${y} ${x + width} ${y + r - c} ${x + width} ${y + r} c`,
    `${x + width} ${y + height - r} l`,
    `${x + width} ${y + height - r + c} ${x + width - r + c} ${y + height} ${x + width - r} ${y + height} c`,
    `${x + r} ${y + height} l`,
    `${x + r - c} ${y + height} ${x} ${y + height - r + c} ${x} ${y + height - r} c`,
    `${x} ${y + r} l`,
    `${x} ${y + r - c} ${x + r - c} ${y} ${x + r} ${y} c`,
    "h",
    stroke ? "B" : "f",
    "Q"
  );

  return parts.join("\n");
}

function lineCommand(
  x1: number,
  y1FromTop: number,
  x2: number,
  y2FromTop: number,
  color: PdfColor,
  width: number
) {
  const y1 = 792 - y1FromTop;
  const y2 = 792 - y2FromTop;

  return [
    "q",
    `${color[0]} ${color[1]} ${color[2]} RG`,
    `${width} w`,
    `${x1} ${y1} m`,
    `${x2} ${y2} l`,
    "S",
    "Q",
  ].join("\n");
}

function imageCommand(
  name: string,
  x: number,
  yFromTop: number,
  width: number,
  height: number
) {
  const y = 792 - yFromTop - height;

  return [
    "q",
    `${width} 0 0 ${height} ${x} ${y} cm`,
    `/${name} Do`,
    "Q",
  ].join("\n");
}

function pdfEscape(value: string) {
  return String(value ?? "")
    .replaceAll("\\", "\\\\")
    .replaceAll("(", "\\(")
    .replaceAll(")", "\\)")
    .replace(/[^\x20-\x7E]/g, "-");
}

function byteLength(value: string) {
  return new TextEncoder().encode(value).length;
}
