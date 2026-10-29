export function getActiveReportWorkWeeks(
  reportWeekKeys: string[],
  loadWeekKeys: Array<string | null | undefined>
) {
  const reportWeeks = new Set(reportWeekKeys);

  return new Set(
    loadWeekKeys.filter(
      (weekKey): weekKey is string =>
        typeof weekKey === "string" && reportWeeks.has(weekKey)
    )
  );
}
