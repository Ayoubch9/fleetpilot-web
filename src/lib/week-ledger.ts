import { dbDate, graceMonday, loadBelongsToWeek, plusDays, weekEnd } from "@/lib/fleetpilot-week";
import { calculateWeekFinance } from "@/lib/week-finance";
import type {
  LedgerExpense,
  LedgerFixedExpense,
  LedgerLoad,
  LedgerMaintenance,
  LedgerOdometer,
  LedgerReimbursement,
  LedgerSettings,
  WeekLedger,} from "@/lib/week-finance";

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
  const [trucksResult, maintenanceResult, loadsResult] = await Promise.all([
    supabase
      .from("trucks")
      .select("id, unit_number, current_mileage, status"),
    supabase
      .from("maintenance_records")
      .select("truck_id, next_service_mileage, next_service_date"),
    supabase
      .from("loads")
      .select("id, load_number, pickup, delivery, pickup_date, status")
      .order("pickup_date", { ascending: false })
      .limit(200),
  ]);

  return {
    trucks: trucksResult.data ?? [],
    maintenanceDueRows: maintenanceResult.data ?? [],
    loads: loadsResult.data ?? [],
    errors: [
      trucksResult.error,
      maintenanceResult.error,
      loadsResult.error,
    ].filter(Boolean),
  };
}


export type DashboardTrendPoint = {
  weekStart: string;
  grossRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number | null;
};

export async function fetchDashboardTrendHistory(
  supabase: SupabaseLike,
  selectedWeekStart: Date,
  weeks = 8
): Promise<{ points: DashboardTrendPoint[]; errors: unknown[] }> {
  const safeWeeks = Math.max(2, Math.min(12, Math.floor(weeks)));
  const firstWeekStart = plusDays(selectedWeekStart, -7 * (safeWeeks - 1));
  const selectedWeekEnd = weekEnd(selectedWeekStart);

  const firstText = dbDate(firstWeekStart);
  const endText = dbDate(selectedWeekEnd);

  const [
    loadsResult,
    expensesResult,
    reimbursementResult,
    fixedResult,
    odometerResult,
    settingsResult,
  ] = await Promise.all([
    supabase
      .from("loads")
      .select(
        "id, load_number, pickup, delivery, pickup_date, delivery_date, rate, loaded_miles, deadhead_miles, status"
      )
      .gte("pickup_date", firstText)
      .lte("pickup_date", endText)
      .order("pickup_date", { ascending: true }),
    supabase
      .from("expenses")
      .select(
        "id, amount, category, expense_date, vendor, description, truck_id"
      )
      .gte("expense_date", firstText)
      .lte("expense_date", endText)
      .order("expense_date", { ascending: true }),
    supabase
      .from("reimbursements")
      .select("id, amount, reimbursement_date")
      .gte("reimbursement_date", firstText)
      .lte("reimbursement_date", endText),
    supabase.from("weekly_fixed_expenses").select("*"),
    supabase
      .from("weekly_odometer_records")
      .select("week_start, start_odometer, end_odometer")
      .gte("week_start", firstText)
      .lte("week_start", endText),
    supabase.from("company_fee_settings").select("*").limit(1),
  ]);

  const allLoads = (loadsResult.data ?? []) as LedgerLoad[];
  const allExpenses = (expensesResult.data ?? []) as LedgerExpense[];
  const allReimbursements =
    (reimbursementResult.data ?? []) as LedgerReimbursement[];
  const fixedExpenses =
    (fixedResult.data ?? []) as LedgerFixedExpense[];
  const allOdometers = (odometerResult.data ?? []) as Array<
    LedgerOdometer & { week_start?: string | null }
  >;
  const settings = ((settingsResult.data ?? []) as LedgerSettings[])[0];

  const points = Array.from({ length: safeWeeks }, (_, index) => {
    const start = plusDays(firstWeekStart, index * 7);
    const startText = dbDate(start);
    const sundayText = dbDate(weekEnd(start));

    const finance = calculateWeekFinance({
      loads: allLoads.filter((load) =>
        loadBelongsToWeek(load.pickup_date, load.delivery_date, start)
      ),
      expenses: allExpenses.filter((row) => {
        const date = row.expense_date?.slice(0, 10) || "";
        return date >= startText && date <= sundayText;
      }),
      reimbursements: allReimbursements.filter((row) => {
        const date = row.reimbursement_date?.slice(0, 10) || "";
        return date >= startText && date <= sundayText;
      }),
      fixedExpenses,
      odometers: allOdometers.filter(
        (row) => row.week_start?.slice(0, 10) === startText
      ),
      settings,
      maintenance: [],
    });

    return {
      weekStart: startText,
      grossRevenue: finance.grossRevenue,
      totalExpenses: finance.totalExpenses,
      netProfit: finance.netProfit,
      profitMargin: finance.profitMargin,
    };
  });

  return {
    points,
    errors: [
      loadsResult.error,
      expensesResult.error,
      reimbursementResult.error,
      fixedResult.error,
      odometerResult.error,
      settingsResult.error,
    ].filter(Boolean),
  };
}
