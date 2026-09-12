"use client";

type TruckRow = {
  unit: string;
  revenue: number;
  expenses: number;
  profit: number;
  loads: number;
};

export default function ReportActions({
  truckRows,
}: {
  truckRows: TruckRow[];
}) {
  function printReport() {
    window.print();
  }

  function exportCsv() {
    const rows = [
      ["Truck", "Revenue", "Expenses", "Net Profit", "Loads"],
      ...truckRows.map((row) => [
        `#${row.unit}`,
        row.revenue.toFixed(2),
        row.expenses.toFixed(2),
        row.profit.toFixed(2),
        String(row.loads),
      ]),
    ];

    const csv = rows
      .map((row) =>
        row
          .map((cell) => `"${String(cell).replaceAll('"', '""')}"`)
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `fleetpilot-report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="fp-report-actions-inline">
      <button onClick={printReport}>Export / Print PDF</button>
      <button onClick={exportCsv}>Export CSV</button>
    </div>
  );
}
