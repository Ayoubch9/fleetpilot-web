import { dbDate, monday, parseDate, weekEnd } from "@/lib/fleetpilot-week";
import { expenseCategoryLabel } from "@/lib/expense-taxonomy";

export type PilotLoadRow = {
  truck_id?: string | null;
  load_number?: string | null;
  pickup?: string | null;
  delivery?: string | null;
  pickup_date?: string | null;
  delivery_date?: string | null;
  rate?: number | string | null;
  loaded_miles?: number | string | null;
  deadhead_miles?: number | string | null;
  status?: string | null;
};

export type PilotExpenseRow = {
  truck_id?: string | null;
  category?: string | null;
  expense_date?: string | null;
  amount?: number | string | null;
  vendor?: string | null;
  gallons?: number | string | null;
  fuel_price_per_gallon?: number | string | null;
};

export type PilotReimbursementRow = {
  amount?: number | string | null;
  reimbursement_date?: string | null;
};

export type PilotOdometerRow = {
  truck_id?: string | null;
  week_start?: string | null;
  start_odometer?: number | string | null;
  end_odometer?: number | string | null;
  rate_per_mile?: number | string | null;
};

export type PilotMaintenanceRow = {
  truck_id?: string | null;
  service_type?: string | null;
  service_date?: string | null;
  cost?: number | string | null;
};

export type PilotTruckRow = {
  id: string;
  unit_number?: string | null;
};

export type PilotWeeklySnapshot = {
  weekStart: string;
  weekEnd: string;
  label: string;
  loads: {
    count: number;
    revenue: number;
    loadedMiles: number;
    deadheadMiles: number;
    totalMiles: number;
  };
  fuel: {
    gallons: number;
    spend: number;
    purchases: number;
    averagePricePerGallon: number | null;
    byTruck: Array<{
      truck: string;
      gallons: number;
      spend: number;
      purchases: number;
    }>;
  };
  expenses: {
    variableTotal: number;
    byCategory: Array<{
      category: string;
      amount: number;
    }>;
  };
  reimbursements: number;
  odometer: {
    miles: number;
    records: number;
    mileageExpense: number;
  };
  maintenance: {
    cost: number;
    records: number;
  };
};

function numberValue(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function weekKey(value?: string | null) {
  const parsed = parseDate(value);
  return parsed ? dbDate(monday(parsed)) : null;
}

function weekLabel(startText: string) {
  const start = parseDate(startText);
  if (!start) return startText;
  const end = weekEnd(start);

  const startLabel = start.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const endLabel = end.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return `${startLabel} – ${endLabel}`;
}

export function buildPilotWeeklySnapshots({
  loads,
  expenses,
  reimbursements,
  odometers,
  maintenance,
  trucks,
  defaultMileageRate = 0.15,
  maxWeeks = 104,
}: {
  loads: PilotLoadRow[];
  expenses: PilotExpenseRow[];
  reimbursements: PilotReimbursementRow[];
  odometers: PilotOdometerRow[];
  maintenance: PilotMaintenanceRow[];
  trucks: PilotTruckRow[];
  defaultMileageRate?: number;
  maxWeeks?: number;
}): PilotWeeklySnapshot[] {
  const keys = new Set<string>();

  for (const row of loads) {
    const key = weekKey(row.pickup_date);
    if (key) keys.add(key);
  }
  for (const row of expenses) {
    const key = weekKey(row.expense_date);
    if (key) keys.add(key);
  }
  for (const row of reimbursements) {
    const key = weekKey(row.reimbursement_date);
    if (key) keys.add(key);
  }
  for (const row of odometers) {
    const key = weekKey(row.week_start);
    if (key) keys.add(key);
  }
  for (const row of maintenance) {
    const key = weekKey(row.service_date);
    if (key) keys.add(key);
  }

  const truckMap = new Map(
    trucks.map((truck) => [
      truck.id,
      truck.unit_number?.trim() || truck.id.slice(0, 6),
    ])
  );

  return [...keys]
    .sort((a, b) => b.localeCompare(a))
    .slice(0, maxWeeks)
    .map((startText) => {
      const start = parseDate(startText)!;
      const endText = dbDate(weekEnd(start));

      const weekLoads = loads.filter(
        (row) => weekKey(row.pickup_date) === startText
      );
      const weekExpenses = expenses.filter(
        (row) => weekKey(row.expense_date) === startText
      );
      const weekReimbursements = reimbursements.filter(
        (row) => weekKey(row.reimbursement_date) === startText
      );
      const weekOdometers = odometers.filter(
        (row) => weekKey(row.week_start) === startText
      );
      const weekMaintenance = maintenance.filter(
        (row) => weekKey(row.service_date) === startText
      );

      const fuelRows = weekExpenses.filter(
        (row) => expenseCategoryLabel(row.category) === "Fuel"
      );

      const fuelSpend = fuelRows.reduce(
        (sum, row) => sum + numberValue(row.amount),
        0
      );
      const fuelGallons = fuelRows.reduce(
        (sum, row) => sum + numberValue(row.gallons),
        0
      );

      const fuelByTruck = new Map<
        string,
        { gallons: number; spend: number; purchases: number }
      >();

      for (const row of fuelRows) {
        const truck =
          (row.truck_id && truckMap.get(row.truck_id)) || "Unassigned";
        const current = fuelByTruck.get(truck) || {
          gallons: 0,
          spend: 0,
          purchases: 0,
        };

        current.gallons += numberValue(row.gallons);
        current.spend += numberValue(row.amount);
        current.purchases += 1;
        fuelByTruck.set(truck, current);
      }

      const categoryTotals = new Map<string, number>();
      for (const row of weekExpenses) {
        const category = expenseCategoryLabel(row.category);
        categoryTotals.set(
          category,
          (categoryTotals.get(category) || 0) + numberValue(row.amount)
        );
      }

      const odometerMiles = weekOdometers.reduce(
        (sum, row) =>
          sum +
          Math.max(
            numberValue(row.end_odometer) -
              numberValue(row.start_odometer),
            0
          ),
        0
      );

      const mileageExpense = weekOdometers.reduce((sum, row) => {
        const miles = Math.max(
          numberValue(row.end_odometer) -
            numberValue(row.start_odometer),
          0
        );
        const rate =
          row.rate_per_mile == null
            ? defaultMileageRate
            : numberValue(row.rate_per_mile);
        return sum + miles * rate;
      }, 0);

      const loadedMiles = weekLoads.reduce(
        (sum, row) => sum + numberValue(row.loaded_miles),
        0
      );
      const deadheadMiles = weekLoads.reduce(
        (sum, row) => sum + numberValue(row.deadhead_miles),
        0
      );

      return {
        weekStart: startText,
        weekEnd: endText,
        label: weekLabel(startText),
        loads: {
          count: weekLoads.length,
          revenue: weekLoads.reduce(
            (sum, row) => sum + numberValue(row.rate),
            0
          ),
          loadedMiles,
          deadheadMiles,
          totalMiles: loadedMiles + deadheadMiles,
        },
        fuel: {
          gallons: fuelGallons,
          spend: fuelSpend,
          purchases: fuelRows.length,
          averagePricePerGallon:
            fuelGallons > 0 ? fuelSpend / fuelGallons : null,
          byTruck: [...fuelByTruck.entries()]
            .map(([truck, value]) => ({
              truck,
              ...value,
            }))
            .sort((a, b) => b.gallons - a.gallons),
        },
        expenses: {
          variableTotal: weekExpenses.reduce(
            (sum, row) => sum + numberValue(row.amount),
            0
          ),
          byCategory: [...categoryTotals.entries()]
            .map(([category, amount]) => ({
              category,
              amount,
            }))
            .sort((a, b) => b.amount - a.amount),
        },
        reimbursements: weekReimbursements.reduce(
          (sum, row) => sum + numberValue(row.amount),
          0
        ),
        odometer: {
          miles: odometerMiles,
          records: weekOdometers.length,
          mileageExpense,
        },
        maintenance: {
          cost: weekMaintenance.reduce(
            (sum, row) => sum + numberValue(row.cost),
            0
          ),
          records: weekMaintenance.length,
        },
      };
    });
}

export function buildPilotDataCoverage({
  loads,
  expenses,
  reimbursements,
  odometers,
  maintenance,
}: {
  loads: PilotLoadRow[];
  expenses: PilotExpenseRow[];
  reimbursements: PilotReimbursementRow[];
  odometers: PilotOdometerRow[];
  maintenance: PilotMaintenanceRow[];
}) {
  function range(values: Array<string | null | undefined>) {
    const dates = values
      .filter((value): value is string => Boolean(value))
      .map((value) => value.slice(0, 10))
      .sort();

    return {
      first: dates[0] || null,
      latest: dates[dates.length - 1] || null,
      records: dates.length,
    };
  }

  return {
    loads: range(loads.map((row) => row.pickup_date)),
    expenses: range(expenses.map((row) => row.expense_date)),
    reimbursements: range(
      reimbursements.map((row) => row.reimbursement_date)
    ),
    odometers: range(odometers.map((row) => row.week_start)),
    maintenance: range(maintenance.map((row) => row.service_date)),
  };
}
