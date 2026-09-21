export const REPORT_FRESHNESS_DAYS = 7;

export function latestDatedValue(
  values: Array<string | null | undefined>
): string | null {
  const dated = values
    .filter((value): value is string => Boolean(value))
    .map((value) => value.slice(0, 10))
    .filter((value) => /^\d{4}-\d{2}-\d{2}$/.test(value))
    .sort();

  return dated.length ? dated[dated.length - 1] : null;
}

export function reportFreshnessLabel(
  latestDate: string | null,
  now = new Date(),
  freshnessDays = REPORT_FRESHNESS_DAYS
) {
  if (!latestDate) return "No dated records";

  const [year, month, day] = latestDate.split("-").map(Number);
  const sourceDate = new Date(year, month - 1, day);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const ageDays = Math.floor(
    (today.getTime() - sourceDate.getTime()) / 86400000
  );

  if (ageDays >= 0 && ageDays <= freshnessDays) return "Live data";

  return `As of ${sourceDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;
}
