import { dbDate, graceMonday, loadBelongsToWeek, weekEnd } from "@/lib/fleetpilot-week";
import type {
  LedgerExpense,
  LedgerFixedExpense,
  LedgerLoad,
  LedgerMaintenance,
  LedgerOdometer,
  LedgerReimbursement,
  LedgerSettings,
  WeekLedger,
} from "@/lib/week-finance";

type SupabaseLike = {
  from: (table: string) => any;
};

export async function fetchWeekLedger(
  supabase: SupabaseLike,
  start: Date
): Promise<{ ledger: WeekLedger; errors: unknown[] }> {
  const sunday = weekEnd(start);
  const startText = dbDate(start);
  const sundayText = dbDate(sunday);

  const [
    loadsResult,
    expensesResult,
    reimbursementResult,
    fixedResult,
    odometerResult,
    settingsResult,
    maintenanceResult,
  ] = await Promise.all([
    supabase
      .from("loads")
      .select(
        "id, load_number, pickup, delivery, pickup_date, delivery_date, rate, loaded_miles, deadhead_miles, status"
      )
      .gte("pickup_date", startText)
      .lte("pickup_date", sundayText)
      .order("pickup_date", { ascending: false }),
    supabase
      .from("expenses")
      .select(
        "id, amount, category, expense_date, vendor, description, truck_id"
      )
      .gte("expense_date", startText)
      .lte("expense_date", sundayText)
      .order("expense_date", { ascending: false }),
    supabase
      .from("reimbursements")
      .select("id, amount, reimbursement_date")
      .gte("reimbursement_date", startText)
      .lte("reimbursement_date", sundayText),
    supabase.from("weekly_fixed_expenses").select("*"),
    supabase
      .from("weekly_odometer_records")
      .select("start_odometer, end_odometer")
      .eq("week_start", startText),
    supabase.from("company_fee_settings").select("*").limit(1),
    supabase
      .from("maintenance_records")
      .select("id, truck_id, service_type, service_date, vendor, cost")
      .gte("service_date", startText)
      .lte("service_date", sundayText)
      .order("service_date", { ascending: false }),
  ]);

  const loads = ((loadsResult.data ?? []) as LedgerLoad[]).filter((load) =>
    loadBelongsToWeek(load.pickup_date, load.delivery_date, start)
  );

  return {
    ledger: {
      loads,
      expenses: (expensesResult.data ?? []) as LedgerExpense[],
      reimbursements:
        (reimbursementResult.data ?? []) as LedgerReimbursement[],
      fixedExpenses: (fixedResult.data ?? []) as LedgerFixedExpense[],
      odometers: (odometerResult.data ?? []) as LedgerOdometer[],
      settings: ((settingsResult.data ?? []) as LedgerSettings[])[0],
      maintenance:
        (maintenanceResult.data ?? []) as LedgerMaintenance[],
    },
    errors: [
      loadsResult.error,
      expensesResult.error,
      reimbursementResult.error,
      fixedResult.error,
      odometerResult.error,
      settingsResult.error,
      maintenanceResult.error,
    ].filter(Boolean),
  };
}

export async function fetchDashboardFleetSupport(supabase: SupabaseLike) {
  const [trucksResult, maintenanceResult] = await Promise.all([
    supabase
      .from("trucks")
      .select("id, unit_number, current_mileage, status"),
    supabase
      .from("maintenance_records")
      .select("truck_id, next_service_mileage, next_service_date"),
  ]);

  return {
    trucks: trucksResult.data ?? [],
    maintenanceDueRows: maintenanceResult.data ?? [],
    errors: [trucksResult.error, maintenanceResult.error].filter(Boolean),
  };
}
