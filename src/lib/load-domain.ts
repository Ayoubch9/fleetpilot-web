import { monday, parseDate, dbDate } from "@/lib/fleetpilot-week";

export const US_STATE_CODES = new Set([
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY","DC",
]);

export type LoadLike = {
  id: string;
  rate?: number | string | null;
  loaded_miles?: number | string | null;
  deadhead_miles?: number | string | null;
  pickup_date?: string | null;
  delivery_date?: string | null;
  status?: string | null;
};

export type LoadExpenseLike = {
  load_id?: string | null;
  amount?: number | string | null;
  category?: string | null;
  expense_date?: string | null;
};

export type FixedExpenseLike = {
  amount?: number | string | null;
  is_active?: boolean | null;
  active?: boolean | null;
};

export type LoadFeeSettingsLike = {
  revenue_fee_percent?: number | string | null;
  mileage_fee_per_mile?: number | string | null;
  is_revenue_fee_active?: boolean | null;
  is_mileage_fee_active?: boolean | null;
};

export type LoadOdometerLike = {
  week_start?: string | null;
  start_odometer?: number | string | null;
  end_odometer?: number | string | null;
};

export type LoadProfitResult = {
  profit: number | null;
  allocatedCost: number | null;
  directFuelAndTolls: number;
  allocatedSharedFuelAndTolls: number | null;
  allocatedFixed: number | null;
  allocatedRevenueFee: number | null;
  allocatedMileageFee: number | null;
  reason?: string;
};

function n(value: unknown) {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric : 0;
}

function titleCaseCity(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\b([a-z])/g, (match) => match.toUpperCase())
    .replace(/\s+/g, " ");
}

export function normalizeUsLocation(input: string):
  | { ok: true; value: string }
  | { ok: false; error: string } {
  const raw = input.trim().replace(/\s+/g, " ");
  const match = raw.match(/^(.+?),\s*([A-Za-z]{2})$/);

  if (!match) {
    return {
      ok: false,
      error: 'Use "City, ST" format, for example "Atlanta, GA".',
    };
  }

  const city = titleCaseCity(match[1]);
  const state = match[2].toUpperCase();

  if (!city) {
    return { ok: false, error: "City is required." };
  }

  if (!US_STATE_CODES.has(state)) {
    return {
      ok: false,
      error: `"${state}" is not a valid U.S. state code.`,
    };
  }

  return { ok: true, value: `${city}, ${state}` };
}

export function normalizeMiles(value: unknown) {
  return Math.max(0, Math.round(n(value)));
}

export function validateLoadMiles(
  loadedMiles: unknown,
  deadheadMiles: unknown
):
  | { ok: true; loadedMiles: number; deadheadMiles: number; totalMiles: number }
  | { ok: false; error: string } {
  const loaded = normalizeMiles(loadedMiles);
  const deadhead = normalizeMiles(deadheadMiles);
  const total = loaded + deadhead;

  if (total <= 0) {
    return {
      ok: false,
      error: "A load must have at least 1 total mile.",
    };
  }

  return {
    ok: true,
    loadedMiles: loaded,
    deadheadMiles: deadhead,
    totalMiles: total,
  };
}

export type EffectiveLoadStatus =
  | "UPCOMING"
  | "DISPATCHED"
  | "IN TRANSIT"
  | "ACTIVE"
  | "DELIVERED"
  | "COMPLETED"
  | "CANCELLED"
  | "EXPIRED"
  | string;

export function normalizeLoadStatus(value?: string | null): EffectiveLoadStatus {
  const status = (value || "UPCOMING").trim().toUpperCase();
  if (status === "CANCELED") return "CANCELLED";
  return status;
}

export function effectiveLoadStatus(
  status: string | null | undefined,
  pickupDate: string | null | undefined,
  now = new Date()
): EffectiveLoadStatus {
  const normalized = normalizeLoadStatus(status);

  if (normalized !== "UPCOMING" || !pickupDate) return normalized;

  const pickup = parseDate(pickupDate);
  if (!pickup) return normalized;

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (pickup.getTime() < today.getTime()) return "EXPIRED";

  return normalized;
}

export function isCompletedLoadStatus(
  status: string | null | undefined,
  pickupDate?: string | null,
  now = new Date()
) {
  const effective = effectiveLoadStatus(status, pickupDate, now);
  return effective === "COMPLETED" || effective === "DELIVERED";
}

export function isTerminalLoadStatus(
  status: string | null | undefined,
  pickupDate?: string | null,
  now = new Date()
) {
  const effective = effectiveLoadStatus(status, pickupDate, now);
  return ["COMPLETED", "DELIVERED", "CANCELLED", "EXPIRED"].includes(effective);
}

function activeFixed(row: FixedExpenseLike) {
  if (typeof row.is_active === "boolean") return row.is_active;
  if (typeof row.active === "boolean") return row.active;
  return true;
}

function isAllocatableDirectCategory(category?: string | null) {
  const key = (category || "").trim().toLowerCase();
  return key.includes("fuel") || key.includes("toll");
}

function weekKey(value?: string | null) {
  const parsed = parseDate(value);
  return parsed ? dbDate(monday(parsed)) : null;
}

export function calculateLoadProfitabilityMap({
  loads,
  expenses,
  fixedExpenses,
  feeSettings,
  odometers = [],
  expenseSourceAvailable = true,
  fixedExpenseSourceAvailable = true,
  feeSettingsSourceAvailable = true,
  odometerSourceAvailable = true,
}: {
  loads: LoadLike[];
  expenses: LoadExpenseLike[];
  fixedExpenses: FixedExpenseLike[];
  feeSettings?: LoadFeeSettingsLike | null;
  odometers?: LoadOdometerLike[];
  expenseSourceAvailable?: boolean;
  fixedExpenseSourceAvailable?: boolean;
  feeSettingsSourceAvailable?: boolean;
  odometerSourceAvailable?: boolean;
}) {
  const result = new Map<string, LoadProfitResult>();

  const fixedWeekly = fixedExpenses
    .filter(activeFixed)
    .reduce((sum, row) => sum + n(row.amount), 0);

  const revenueFeePercent =
    feeSettings?.revenue_fee_percent == null
      ? 15
      : n(feeSettings.revenue_fee_percent);
  const mileageFeeRate =
    feeSettings?.mileage_fee_per_mile == null
      ? 0.15
      : n(feeSettings.mileage_fee_per_mile);
  const revenueFeeActive =
    feeSettings?.is_revenue_fee_active == null
      ? true
      : Boolean(feeSettings.is_revenue_fee_active);
  const mileageFeeActive =
    feeSettings?.is_mileage_fee_active == null
      ? true
      : Boolean(feeSettings.is_mileage_fee_active);

  const weekMiles = new Map<string, number>();
  for (const load of loads) {
    const key = weekKey(load.pickup_date);
    if (!key) continue;
    const miles =
      normalizeMiles(load.loaded_miles) + normalizeMiles(load.deadhead_miles);
    if (miles <= 0) continue;
    weekMiles.set(key, (weekMiles.get(key) || 0) + miles);
  }

  const odometerMilesByWeek = new Map<string, number>();
  for (const row of odometers) {
    const key = weekKey(row.week_start);
    if (!key) continue;
    const miles = Math.max(
      n(row.end_odometer) - n(row.start_odometer),
      0
    );
    odometerMilesByWeek.set(
      key,
      (odometerMilesByWeek.get(key) || 0) + miles
    );
  }

  const directByLoad = new Map<string, number>();
  const sharedFuelAndTollsByWeek = new Map<string, number>();

  for (const expense of expenses) {
    if (!isAllocatableDirectCategory(expense.category)) continue;

    const amount = Math.max(0, n(expense.amount));
    if (amount <= 0) continue;

    if (expense.load_id) {
      directByLoad.set(
        expense.load_id,
        (directByLoad.get(expense.load_id) || 0) + amount
      );
      continue;
    }

    const key = weekKey(expense.expense_date);
    if (key) {
      sharedFuelAndTollsByWeek.set(
        key,
        (sharedFuelAndTollsByWeek.get(key) || 0) + amount
      );
    }
  }

  const unavailable = (
    loadId: string,
    direct: number,
    reason: string
  ) => {
    result.set(loadId, {
      profit: null,
      allocatedCost: null,
      directFuelAndTolls: direct,
      allocatedSharedFuelAndTolls: null,
      allocatedFixed: null,
      allocatedRevenueFee: null,
      allocatedMileageFee: null,
      reason,
    });
  };

  for (const load of loads) {
    const rate = n(load.rate);
    const miles =
      normalizeMiles(load.loaded_miles) + normalizeMiles(load.deadhead_miles);
    const key = weekKey(load.pickup_date);
    const direct = directByLoad.get(load.id) || 0;

    if (!expenseSourceAvailable) {
      unavailable(
        load.id,
        direct,
        "Profit unavailable: fuel/toll costs could not be loaded."
      );
      continue;
    }

    if (!fixedExpenseSourceAvailable) {
      unavailable(
        load.id,
        direct,
        "Profit unavailable: weekly fixed costs could not be loaded."
      );
      continue;
    }

    if (!feeSettingsSourceAvailable) {
      unavailable(
        load.id,
        direct,
        "Profit unavailable: company fee settings could not be loaded."
      );
      continue;
    }

    if (mileageFeeActive && !odometerSourceAvailable) {
      unavailable(
        load.id,
        direct,
        "Profit unavailable: weekly odometer mileage could not be loaded."
      );
      continue;
    }

    if (rate <= 0) {
      unavailable(
        load.id,
        direct,
        "Profit unavailable: this load has no valid rate."
      );
      continue;
    }

    if (!key) {
      unavailable(
        load.id,
        direct,
        "Profit unavailable: this load has no valid pickup date."
      );
      continue;
    }

    if (miles <= 0) {
      unavailable(
        load.id,
        direct,
        "Profit unavailable: this load has no verified mileage."
      );
      continue;
    }

    const totalWeekMiles = weekMiles.get(key) || 0;
    if (totalWeekMiles <= 0) {
      unavailable(
        load.id,
        direct,
        "Profit unavailable: weekly mileage cannot be allocated."
      );
      continue;
    }

    const mileageShare = miles / totalWeekMiles;

    const allocatedSharedFuelAndTolls =
      (sharedFuelAndTollsByWeek.get(key) || 0) * mileageShare;

    const allocatedFixed = fixedWeekly * mileageShare;

    // Revenue fee is inherently revenue-based, so each load receives its own
    // exact percentage instead of a mileage-weighted approximation.
    const allocatedRevenueFee = revenueFeeActive
      ? rate * (revenueFeePercent / 100)
      : 0;

    // Weekly Settlement charges the mileage fee from recorded odometer miles.
    // Allocate that same weekly fee back to loads by their share of load miles.
    const weeklyMileageFee = mileageFeeActive
      ? (odometerMilesByWeek.get(key) || 0) * mileageFeeRate
      : 0;
    const allocatedMileageFee = weeklyMileageFee * mileageShare;

    const allocatedCost =
      direct +
      allocatedSharedFuelAndTolls +
      allocatedFixed +
      allocatedRevenueFee +
      allocatedMileageFee;

    result.set(load.id, {
      profit: rate - allocatedCost,
      allocatedCost,
      directFuelAndTolls: direct,
      allocatedSharedFuelAndTolls,
      allocatedFixed,
      allocatedRevenueFee,
      allocatedMileageFee,
    });
  }

  return result;
}
