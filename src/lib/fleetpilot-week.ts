export function num(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

export function dbDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseDate(value?: string | null): Date | null {
  if (!value) return null;
  const parts = value.slice(0, 10).split("-").map(Number);
  if (parts.length !== 3 || parts.some((v) => !Number.isFinite(v))) return null;
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

export function monday(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay();
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  return d;
}

export function plusDays(date: Date, amount: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + amount);
  return d;
}

export function weekEnd(start: Date): Date {
  return plusDays(start, 6);
}

export function graceMonday(start: Date): Date {
  return plusDays(start, 7);
}

export function displayDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

export function money(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function selectedWeek(value?: string): Date {
  const parsed = parseDate(value);
  return monday(parsed ?? new Date());
}

export function loadBelongsToWeek(
  pickupValue: string | null | undefined,
  deliveryValue: string | null | undefined,
  start: Date
): boolean {
  const pickup = parseDate(pickupValue);
  const delivery = parseDate(deliveryValue);

  if (!pickup || !delivery) return false;

  const sunday = weekEnd(start);
  const mondayAfter = graceMonday(start);

  return (
    pickup.getTime() >= start.getTime() &&
    pickup.getTime() <= sunday.getTime() &&
    delivery.getTime() >= pickup.getTime() &&
    delivery.getTime() <= mondayAfter.getTime()
  );
}
