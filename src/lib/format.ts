const moneyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const percentFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export function formatMoney(value: number | string | null | undefined): string {
  const numeric = Number(value ?? 0);
  return moneyFormatter.format(Number.isFinite(numeric) ? numeric : 0);
}

export function formatPercent(value: number | string | null | undefined): string {
  const numeric = Number(value ?? 0);
  return `${percentFormatter.format(Number.isFinite(numeric) ? numeric : 0)}%`;
}
