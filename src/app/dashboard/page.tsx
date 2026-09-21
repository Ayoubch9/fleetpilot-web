import { CHART_PALETTE, chartCategoryColor } from "@/lib/chart-palette";
import { formatMoney, formatPercent } from "@/lib/format";
import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import AppShell from "@/components/app-shell";
import { SectionPanel, EmptyState } from "@/components/fleet-ui";
import DashboardQuickActions from "./dashboard-quick-actions";
import { getMileVoxaAccount } from "@/lib/fleetpilot-account";
import {
  dbDate,
  displayDate,
  parseDate,
  plusDays,
  selectedWeek,
  weekEnd,
} from "@/lib/fleetpilot-week";
import {
  buildExpenseBreakdown,
  buildWeekActivity,
  calculateTrend,
  calculateWeekFinance,
  numberValue,
  type TrendResult,
} from "@/lib/week-finance";
import {
  fetchDashboardFleetSupport,
  fetchWeekLedger,
} from "@/lib/week-ledger";

type SearchParams = Promise<{
  week?: string;
}>;

type RawTruck = {
  id?: string | null;
  unit_number?: string | null;
  current_mileage?: number | string | null;
  status?: string | null;
};

type RawMaintenanceDue = {
  truck_id?: string | null;
  next_service_mileage?: number | string | null;
  next_service_date?: string | null;
};

function money(value: number): string {
  return formatMoney(value);
}

function sameDate(a: Date, b: Date): boolean {
  return dbDate(a) === dbDate(b);
}

function isActiveTruck(status?: string | null): boolean {
  const normalized = (status ?? "").trim().toUpperCase();
  if (["INACTIVE", "PARKED", "OUT OF SERVICE", "OUT"].includes(normalized)) {
    return false;
  }
  return normalized === "" ||
    ["ACTIVE", "AVAILABLE", "RUNNING", "IN SERVICE"].includes(normalized);
}

function trendCopy(trend: TrendResult | null): string {
  if (!trend) return "No comparable prior week";
  if (trend.direction === "flat") return "No material change vs previous week";
  return `${trend.direction === "up" ? "↑" : "↓"} ${formatPercent(
    Math.abs(trend.percent)
  )} vs previous week`;
}

function expenseTrendTone(trend: TrendResult | null) {
  if (!trend) return "neutral" as const;
  if (trend.direction === "down") return "positive" as const;
  if (trend.direction === "up") return "negative" as const;
  return "neutral" as const;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const { supabase, fullName, companyName, role } =
    await getMileVoxaAccount();

  const today = new Date();
  const currentWeekStart = selectedWeek(undefined);
  const cookieStore = await cookies();
  const rememberedWeek = cookieStore.get("fleetpilot_week")?.value;

  let selectedWeekStart = selectedWeek(params.week || rememberedWeek);
  if (selectedWeekStart.getTime() > currentWeekStart.getTime()) {
    redirect("/dashboard");
  }

  const selectedWeekEnd = weekEnd(selectedWeekStart);
  const isCurrentWeek = sameDate(selectedWeekStart, currentWeekStart);

  const todayClean = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  const weekProgressDays = isCurrentWeek
    ? Math.min(
        7,
        Math.max(
          1,
          Math.floor(
            (todayClean.getTime() - selectedWeekStart.getTime()) /
              (24 * 60 * 60 * 1000)
          ) + 1
        )
      )
    : 7;
  const weekProgressPercent = Math.round((weekProgressDays / 7) * 100);
  const weekDaysRemaining = Math.max(0, 7 - weekProgressDays);
  const settlementHref = isCurrentWeek
    ? "/settlement"
    : `/settlement?week=${dbDate(selectedWeekStart)}`;

  const previousWeekStart = plusDays(selectedWeekStart, -7);

  const [
    currentWeekResult,
    previousWeekResult,
    fleetSupport,
  ] = await Promise.all([
    fetchWeekLedger(supabase, selectedWeekStart),
    fetchWeekLedger(supabase, previousWeekStart),
    fetchDashboardFleetSupport(supabase),
  ]);

  const ledger = currentWeekResult.ledger;
  const previousLedger = previousWeekResult.ledger;
  const finance = calculateWeekFinance(ledger);
  const previousFinance = calculateWeekFinance(previousLedger);

  const errors = [
    ...currentWeekResult.errors,
    ...previousWeekResult.errors,
    ...fleetSupport.errors,
  ];

  const loads = ledger.loads;
  const expenses = ledger.expenses;
  const trucks = fleetSupport.trucks as RawTruck[];
  const maintenanceRows =
    fleetSupport.maintenanceDueRows as RawMaintenanceDue[];

  const {
    grossRevenue,
    totalMiles,
    totalExpenses,
    netProfit,
    profitMargin,
  } = finance;

  const netProfitTrend = calculateTrend(
    netProfit,
    previousFinance.netProfit
  );
  const grossRevenueTrend = calculateTrend(
    grossRevenue,
    previousFinance.grossRevenue
  );
  const totalExpensesTrend = calculateTrend(
    totalExpenses,
    previousFinance.totalExpenses
  );
  const marginTrend =
    profitMargin == null || previousFinance.profitMargin == null
      ? null
      : calculateTrend(profitMargin, previousFinance.profitMargin);

  const activity = buildWeekActivity(ledger).slice(0, 5);
  const expenseBreakdownDataRaw = buildExpenseBreakdown(ledger);
  const expenseBreakdownTotal = expenseBreakdownDataRaw.reduce(
    (sum, item) => sum + item.value,
    0
  );

  const activeTrucks = trucks.filter((truck) => isActiveTruck(truck.status));
  const quickActionTrucks = activeTrucks
    .filter(
      (truck): truck is RawTruck & { id: string; unit_number: string } =>
        Boolean(truck.id && truck.unit_number)
    )
    .map((truck) => ({
      id: truck.id,
      unit_number: truck.unit_number,
      current_mileage: numberValue(truck.current_mileage),
    }));

  const activeTruckIds = new Set(
    activeTrucks
      .map((truck) => truck.id)
      .filter((id): id is string => Boolean(id))
  );

  const truckMileage = new Map<string, number>();
  for (const truck of activeTrucks) {
    if (truck.id) {
      truckMileage.set(truck.id, numberValue(truck.current_mileage));
    }
  }

  const cleanToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  let maintenanceDueCount = 0;

  for (const record of maintenanceRows) {
    if (!record.truck_id || !activeTruckIds.has(record.truck_id)) continue;

    let due = false;

    if (record.next_service_mileage != null) {
      const currentMileage = truckMileage.get(record.truck_id) ?? 0;
      if (currentMileage >= numberValue(record.next_service_mileage)) {
        due = true;
      }
    }

    if (record.next_service_date) {
      const dueDate = parseDate(record.next_service_date);
      if (dueDate && dueDate.getTime() <= cleanToday.getTime()) {
        due = true;
      }
    }

    if (due) maintenanceDueCount += 1;
  }



  const firstName = fullName.split(/\s+/)[0] || "Driver";

  const expenseBreakdownData = expenseBreakdownDataRaw.map((item, index) => ({
    ...item,
    color: chartCategoryColor(index),
  }));


  return (
    <AppShell
      active="overview"
      fullName={fullName}
      companyName={companyName}
      role={role}
    >
      <div className="fp-page">
        <section className="fp-hero-exact min-h-[138px] rounded-[14px] border border-[#dfe7ef] px-7 py-6">
          <div className="relative z-10 max-w-[620px]">
            <h1 className="text-[30px] font-[800] tracking-[-.05em] text-[#0b1730] sm:text-[37px]">
              Good evening, <span className="text-[#16853B]">{firstName}</span> 👋
            </h1>
            <p className="mt-1.5 text-[13px] font-[500] text-[#64778f]">
              Keep moving forward. Every mile counts.
            </p>
            <div className="mt-3 fp-overline">
              MileVoxa Control Center
            </div>
          </div>
          <div className="absolute bottom-5 right-8 z-10 hidden text-right text-[10px] font-[700] uppercase tracking-[.27em] text-white drop-shadow-lg xl:block">
            Drive<br />Smarter.<br />Earn More.
            <div className="ml-auto mt-2 h-[3px] w-9 bg-[#16853B]" />
          </div>
        </section>

        {errors.length > 0 && (
          <div className="mt-3 rounded-[10px] border border-[#ffcf82] bg-[#fff6e7] px-4 py-3 text-[10px] font-bold text-[#966217]">
            Some dashboard data could not be loaded. Successfully returned data is still shown.
          </div>
        )}

        <div className="fp-kpi-strip mt-3">
          <DashboardMetric
            label="Net Profit"
            value={money(netProfit)}
            tone={netProfit > 0 ? "green" : netProfit < 0 ? "red" : "blue"}
            icon="$"
            change={trendCopy(netProfitTrend)}
            changeTone={netProfitTrend?.tone || "neutral"}
          />
          <DashboardMetric
            label="Gross Revenue"
            value={money(grossRevenue)}
            tone="blue"
            icon="▥"
            change={trendCopy(grossRevenueTrend)}
            changeTone={grossRevenueTrend?.tone || "neutral"}
          />
          <DashboardMetric
            label="Total Expenses"
            value={money(totalExpenses)}
            tone="red"
            icon="◉"
            change={trendCopy(totalExpensesTrend)}
            changeTone={expenseTrendTone(totalExpensesTrend)}
          />
          <DashboardMetric
            label="Profit Margin"
            value={profitMargin == null ? "n/a" : formatPercent(profitMargin)}
            tone={profitMargin != null && profitMargin > 0 ? "green" : "purple"}
            icon="%"
            change={profitMargin == null ? "n/a" : trendCopy(marginTrend)}
            changeTone={marginTrend?.tone || "neutral"}
          />
        </div>

<div className="fp-dashboard-master mt-3">
  <div className="fp-dashboard-left">
    <div className="fp-dashboard-analytics-row">
      <SectionPanel
        className="fp-chart-card"
        title="Revenue vs Expenses"
      >
        <div className="px-4 pb-4">
          <BarChart revenue={grossRevenue} expenses={totalExpenses} profit={netProfit} weekStart={selectedWeekStart} />
        </div>
      </SectionPanel>

      <SectionPanel
        className="fp-breakdown-card"
        title="Expense Breakdown"
        right={<Link href="/expenses" className="text-[9px] font-[700] text-[#16853B]">View Details →</Link>}
      >
        <div className="grid h-[250px] items-center gap-4 px-4 pb-4 md:grid-cols-[145px_minmax(0,1fr)]">
          <ExpenseDonut
            total={expenseBreakdownTotal}
            items={expenseBreakdownData}
          />

          <div className="grid grid-rows-6 gap-[8px]">
            {expenseBreakdownData.map((item) => (
              <ExpenseLegendRow
                key={item.label}
                label={item.label}
                value={item.value}
                total={expenseBreakdownTotal}
                color={item.color}
              />
            ))}
          </div>
        </div>
      </SectionPanel>
    </div>

    <div className="fp-dashboard-recent-row mt-3">
              <SectionPanel
                className="fp-recent-card"
                title="Recent Loads"
                right={
                  <Link
                    href="/loads"
                    className="flex items-center gap-1 text-[9px] font-[600] text-[#16853B]"
                  >
                    View All <span className="text-[11px]">→</span>
                  </Link>
                }
              >
                <div className="fp-recent-loads-wrap px-3 pb-3">
                  <div className="overflow-hidden">
                    <table className="fp-recent-loads-table w-full border-separate border-spacing-0">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Route</th>
                          <th>Date</th>
                          <th>Miles</th>
                          <th>Revenue</th>
                          <th>Profit</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loads.slice(-5).reverse().map((load, index) => {
                          const loadRevenue = numberValue(load.rate);
                          const loadMiles =
                            numberValue(load.loaded_miles) +
                            numberValue(load.deadhead_miles);

                          // Dashboard doesn't yet have complete load-level allocated
                          // cost data. Use the weekly net margin as the display signal
                          // so the visual column is still consistent with MileVoxa's
                          // real accounting instead of inventing a random number.
                          const marginRatio =
                            grossRevenue > 0
                              ? Math.max(0, Math.min(1, netProfit / grossRevenue))
                              : 0;

                          const estimatedLoadProfit = loadRevenue * marginRatio;

                          return (
                            <tr key={`${load.load_number}-${index}`}>
                              <td className="fp-load-id">
                                #{load.load_number || "—"}
                              </td>
                              <td className="fp-load-route" title={`${compactLocation(load.pickup)} → ${compactLocation(load.delivery)}`}>
                                <span>{compactLocation(load.pickup)}</span>
                                <span className="mx-1 text-[#93a1b0]">→</span>
                                <span>{compactLocation(load.delivery)}</span>
                              </td>
                              <td>{shortDate(load.pickup_date)}</td>
                              <td>{loadMiles.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                              <td className="fp-load-money">{money(loadRevenue)}</td>
                              <td className="fp-load-profit">
                                {money(estimatedLoadProfit)}
                              </td>
                              <td>
                                <span className="fp-load-status">
                                  {load.status || "Recorded"}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>

                    {loads.length === 0 && (
                      <EmptyState text="No loads recorded for this week." />
                    )}
                  </div>
                </div>
              </SectionPanel>

      <SectionPanel
        className="fp-activity-card"
        title="Recent Activity"
        right={
          <span className="flex items-center gap-1 text-[9px] font-[600] text-[#16853B]">
            View All <span className="text-[11px]">→</span>
          </span>
        }
      >
        <div className="fp-activity-list px-3 pb-3">
          {activity.map((event) => (
            <Activity
              key={event.id}
              type={event.type}
              text={event.text}
              amount={
                event.amount == null
                  ? "—"
                  : event.amount < 0
                    ? `-${money(Math.abs(event.amount))}`
                    : money(event.amount)
              }
              when={shortDate(event.occurredOn)}
            />
          ))}
          {activity.length === 0 && (
            <EmptyState text="No activity this week yet - add your first load/expense." />
          )}
        </div>
      </SectionPanel>
    </div>

    <div className="fp-dashboard-left-footer mt-3">
      <SectionPanel
                  title="Fleet Status"
                  right={<Link href="/trucks" className="text-[9px] font-[700] text-[#16853B]">View Fleet →</Link>}
                >
                  <div className="fp-fleet-status-grid px-4 pb-4">
                    <FleetKpi label="Active Truck" value={`${activeTrucks.length}`} icon="truck" />
                    <FleetKpi label="Service Due" value={`${maintenanceDueCount}`} icon="service" />
                    <FleetKpi label="Total Loads This Week" value={`${loads.length}`} icon="loads" />
                    <FleetKpi label="Total Miles This Week" value={totalMiles.toLocaleString(undefined, { maximumFractionDigits: 0 })} icon="miles" />
                  </div>
                </SectionPanel>

                <div className="fp-quote-card relative overflow-hidden rounded-[13px] border border-[#d7e2ec] bg-[url('/milevoxa-hero-clean.jpg')] bg-cover bg-center shadow-[0_8px_28px_rgba(29,65,102,.08)]">
                  <div className="absolute inset-0 bg-gradient-to-r from-[#102238]/95 via-[#102238]/55 to-transparent" />
                  <div className="relative z-10 max-w-[390px] p-5 text-white">
                    <div className="text-[17px] font-[700] leading-6 tracking-[-.02em]">
                      “Success is a long haul<br />built on daily discipline.”
                    </div>
                    <div className="mt-2 text-[10px] text-white/75">Keep pushing forward.</div>
                    <div className="mt-4 h-[3px] w-10 bg-[#16853B]" />
                  </div>
    </div>

    </div>
  </div>

  <aside className="fp-dashboard-right-rail">
    <SectionPanel className="fp-side-compact fp-week-progress-card" title="Week Progress">
      <Link href={settlementHref} className="fp-week-progress-link">
        <ProgressRing value={weekProgressPercent} />
        <div className="fp-week-progress-copy">
          <div className="fp-week-progress-range">
            {displayDate(selectedWeekStart)} – {displayDate(selectedWeekEnd)}
          </div>

          <div className="fp-week-progress-state">
            {isCurrentWeek ? "Current Week" : "Selected Week"}
          </div>

          <div className="fp-week-progress-detail">
            {isCurrentWeek ? (
              <>
                <strong>{weekProgressDays} of 7 days</strong>
                <span>
                  {weekDaysRemaining === 0
                    ? "Week complete"
                    : `${weekDaysRemaining} day${weekDaysRemaining === 1 ? "" : "s"} remaining`}
                </span>
              </>
            ) : (
              <>
                <strong>7 of 7 days</strong>
                <span>Week complete</span>
              </>
            )}
          </div>

          <span className="fp-week-progress-open">
            View settlement →
          </span>
        </div>
      </Link>
    </SectionPanel>

    <SectionPanel className="fp-quick-actions-card" title="Quick Actions">
      <DashboardQuickActions trucks={quickActionTrucks} />
    </SectionPanel>

    <SectionPanel
      className="fp-side-ai fp-pilot-card"
      title={
        <span className="flex items-center gap-2">
          <span>Pilot AI</span>
          <span className="rounded-full border border-[#8bc7ff] bg-[#edf7ff] px-2 py-[2px] text-[7px] font-[700] text-[#16853B]">
            Beta
          </span>
        </span>
      }
    >
      <div className="px-3 pb-3">
        <div className="fp-pilot-intro">
          <div className="fp-pilot-orb">
            <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-none stroke-white" strokeWidth="1.7">
              <path d="m12 3 1.4 4.3L18 9l-4.6 1.6L12 15l-1.4-4.4L6 9l4.6-1.7L12 3Z" />
              <path d="m18.2 3.8.7 2.1 2.1.7-2.1.7-.7 2.1-.7-2.1-2.1-.7 2.1-.7.7-2.1Z" />
            </svg>
          </div>

          <div className="min-w-0">
            <div className="text-[11px] font-[700] text-[#10203a]">
              Ask MileVoxa
            </div>
            <div className="mt-1 text-[8px] leading-[1.35] text-[#6a7d93]">
              Get insights about your business, find opportunities, and make smarter decisions.
            </div>
          </div>
        </div>

        <Link href="/pilot-ai" className="fp-pilot-start mt-3">
          Start a conversation <span>→</span>
        </Link>

        <div className="fp-pilot-questions mt-3">
          {[
            "Why was my profit lower this week?",
            "Which truck is most profitable?",
            "Show me my fuel spending trends",
            "What maintenance is due soon?",
          ].map((question) => (
            <Link
              key={question}
              href={`/pilot-ai?q=${encodeURIComponent(question)}`}
              className="fp-pilot-question"
              title={question}
            >
              <span className="fp-pilot-question-icon">?</span>
              <span className="truncate">{question}</span>
            </Link>
          ))}
        </div>
      </div>
    </SectionPanel>
  </aside>
        </div>
      </div>
    </AppShell>
  );
}


function DashboardMetric({
  label,
  value,
  tone,
  icon,
  change,
  changeTone = "neutral",
}: {
  label: string;
  value: string;
  tone: "green" | "blue" | "red" | "purple";
  icon: string;
  change: string;
  changeTone?: "positive" | "negative" | "neutral";
}) {
  const palette = {
    green: { stroke: "#22a861", soft: "#eaf8f0", text: "#22a861" },
    blue: { stroke: CHART_PALETTE.navy, soft: "rgba(16,34,56,.08)", text: CHART_PALETTE.navy },
    red: { stroke: "#ee646b", soft: "#fff0f1", text: "#eb5862" },
    purple: { stroke: "#6f63f4", soft: "#f1efff", text: "#6b5fe9" },
  }[tone];

  return (
    <div className="fp-dashboard-metric">
      <div
        className="fp-dashboard-metric-icon"
        style={{ backgroundColor: palette.soft, color: palette.text }}
      >
        {icon}
      </div>

      <div className="fp-dashboard-metric-copy">
        <div className="fp-dashboard-metric-label">{label}</div>
        <div className="fp-number fp-dashboard-metric-value">{value}</div>
        <div
          className="fp-dashboard-metric-change"
          style={{
            color:
              changeTone === "positive"
                ? CHART_PALETTE.green
                : changeTone === "negative"
                  ? CHART_PALETTE.red
                  : CHART_PALETTE.gray,
          }}
        >
          {change}
        </div>
      </div>

      <div className="fp-dashboard-metric-chart">
        <MetricMiniChart tone={tone} />
      </div>
    </div>
  );
}

function MetricMiniChart({
  tone,
}: {
  tone: "green" | "blue" | "red" | "purple";
}) {
  const config = {
    green: { stroke: CHART_PALETTE.green, fill: "rgba(22,133,59,.09)", data: [28,24,26,20,23,16,19,13,15,10,7] },
    blue: { stroke: CHART_PALETTE.navy, fill: "rgba(16,34,56,.09)", data: [29,25,27,20,24,16,20,13,16,10,6] },
    red: { stroke: CHART_PALETTE.red, fill: "rgba(220,38,38,.09)", data: [30,26,28,21,24,17,20,13,15,9,5] },
    purple: { stroke: CHART_PALETTE.purple, fill: "rgba(124,58,237,.09)", data: [28,24,27,20,23,15,19,12,15,9,5] },
  }[tone];

  const width = 104;
  const height = 46;
  const step = width / (config.data.length - 1);
  const points = config.data.map((y, i) => `${i * step},${y}`).join(" ");
  const area = `M 0 ${config.data[0]} ` +
    config.data.slice(1).map((y, i) => `L ${(i + 1) * step} ${y}`).join(" ") +
    ` L ${width} ${height} L 0 ${height} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full overflow-visible">
      <line x1="0" y1="34" x2={width} y2="34" stroke="#e5ebf1" strokeWidth=".8" />
      <line x1="0" y1="20" x2={width} y2="20" stroke="#eef2f6" strokeWidth=".7" strokeDasharray="2 3" />
      <path d={area} fill={config.fill} />
      <polyline
        points={points}
        fill="none"
        stroke={config.stroke}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {config.data.map((y, i) => (
        <circle
          key={i}
          cx={i * step}
          cy={y}
          r={i === config.data.length - 1 ? 2.6 : 1.1}
          fill={i === config.data.length - 1 ? "#fff" : config.stroke}
          stroke={i === config.data.length - 1 ? config.stroke : "none"}
          strokeWidth={i === config.data.length - 1 ? 1.6 : 0}
          opacity={i === config.data.length - 1 ? 1 : .72}
        />
      ))}
    </svg>
  );
}

function BarChart({
  revenue,
  expenses,
  profit,
  weekStart,
}: {
  revenue: number;
  expenses: number;
  profit: number;
  weekStart: Date;
}) {
  const revenueFactors = [0.38, 0.55, 0.60, 0.72, 0.83, 0.91, 1];
  const expenseFactors = [0.34, 0.49, 0.58, 0.70, 0.80, 0.88, 1];
  const profitFactors = [0.30, 0.44, 0.55, 0.68, 0.76, 0.85, 1];

  const revenueSeries = revenueFactors.map((factor) => revenue * factor);
  const expenseSeries = expenseFactors.map((factor) => expenses * factor);
  const profitSeries = profitFactors.map((factor) => Math.max(profit, 0) * factor);

  const rawMax = Math.max(
    4000,
    ...revenueSeries,
    ...expenseSeries,
    ...profitSeries,
    1
  );

  const chartMax = Math.max(4000, Math.ceil(rawMax / 1000) * 1000);
  const gridSteps = 4;

  return (
    <div className="pt-1">
      <div className="mb-3 flex items-center justify-center gap-5 text-[9px] font-[600] text-[#60728a]">
        <ChartLegend color={CHART_PALETTE.navy} label="Revenue" />
        <ChartLegend color={CHART_PALETTE.red} label="Expenses" />
        <ChartLegend color={CHART_PALETTE.green} label="Profit" />
      </div>

      <div className="grid grid-cols-[34px_minmax(0,1fr)] gap-2">
        <div className="relative h-[176px]">
          {Array.from({ length: gridSteps + 1 }).map((_, index) => {
            const value = chartMax - (chartMax / gridSteps) * index;

            return (
              <span
                key={index}
                className="absolute right-0 -translate-y-1/2 text-[8px] font-[500] text-[#71839a]"
                style={{ top: `${(index / gridSteps) * 100}%` }}
              >
                {value === 0 ? "$0" : `$${Math.round(value / 1000)}K`}
              </span>
            );
          })}
        </div>

        <div>
          <div className="relative h-[176px] border-b border-l border-[#d7e1eb]">
            {Array.from({ length: gridSteps + 1 }).map((_, index) => (
              <div
                key={`horizontal-${index}`}
                className="absolute left-0 right-0 border-t border-[#e3eaf1]"
                style={{ top: `${(index / gridSteps) * 100}%` }}
              />
            ))}

            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={`vertical-${index}`}
                className="absolute bottom-0 top-0 border-l border-[#e7edf3]"
                style={{ left: `${(index / 7) * 100}%` }}
              />
            ))}

            <div className="absolute inset-0 grid grid-cols-7 items-end px-[10px]">
              {revenueSeries.map((revenueValue, index) => (
                <div
                  key={index}
                  className="flex h-full items-end justify-center gap-[4px]"
                >
                  <ChartBar
                    value={revenueValue}
                    max={chartMax}
                    color={CHART_PALETTE.navy}
                  />
                  <ChartBar
                    value={expenseSeries[index]}
                    max={chartMax}
                    color={CHART_PALETTE.red}
                  />
                  <ChartBar
                    value={profitSeries[index]}
                    max={chartMax}
                    color={CHART_PALETTE.green}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="mt-2 grid grid-cols-7 px-[2px] text-center text-[8px] font-[500] text-[#71839a]">
            {Array.from({ length: 7 }).map((_, index) => {
              const date = new Date(weekStart);
              date.setDate(weekStart.getDate() + index);

              return (
                <span key={index}>
                  {new Intl.DateTimeFormat("en-US", {
                    month: "short",
                    day: "numeric",
                  }).format(date)}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function ChartBar({
  value,
  max,
  color,
}: {
  value: number;
  max: number;
  color: string;
}) {
  const height = Math.max(2.5, Math.min(100, (value / max) * 100));

  return (
    <div
      className="w-[10px] rounded-t-[1.5px]"
      style={{
        height: `${height}%`,
        backgroundColor: color,
      }}
    />
  );
}

function ChartLegend({
  color,
  label,
}: {
  color: string;
  label: string;
}) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className="h-[9px] w-[9px] rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}

function ExpenseDonut({
  total,
  items,
}: {
  total: number;
  items: readonly {
    label: string;
    value: number;
    color: string;
  }[];
}) {
  let cursor = 0;

  const stops = items.map((item) => {
    const share = total > 0 ? (item.value / total) * 100 : 0;
    const start = cursor;
    const end = cursor + share;
    cursor = end;
    return `${item.color} ${start}% ${end}%`;
  });

  const background =
    total > 0
      ? `conic-gradient(${stops.join(", ")})`
      : "conic-gradient(#e8eef4 0 100%)";

  return (
    <div
      className="relative mx-auto flex h-[145px] w-[145px] items-center justify-center rounded-full"
      style={{ background }}
    >
      <div className="flex h-[86px] w-[86px] flex-col items-center justify-center rounded-full bg-white">
        <div className="fp-number text-[13px] font-[800] text-[#0B1730]">
          {money(total)}
        </div>
        <div className="mt-1 text-[8px] font-[600] text-[#71839a]">
          Total
        </div>
      </div>
    </div>
  );
}

function ExpenseLegendRow({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const percentage = total > 0 ? (value / total) * 100 : 0;

  return (
    <div className="grid min-h-[21px] grid-cols-[minmax(0,1fr)_38px] items-center gap-3">
      <div className="flex min-w-0 items-center gap-2.5">
        <span
          className="h-[10px] w-[10px] shrink-0 rounded-full"
          style={{ backgroundColor: color }}
        />
        <span className="truncate text-[10px] font-[600] text-[#51657d]">
          {label}
        </span>
      </div>

      <span className="text-right text-[10px] font-[700] tabular-nums text-[#0B1730]">
        {formatPercent(percentage)}
      </span>
    </div>
  );
}

function ProgressRing({ value }: { value: number }) {
  return (
    <div className="relative flex h-[74px] w-[74px] items-center justify-center rounded-full"
      style={{ background: `conic-gradient(#17c978 ${value}%, #e7edf3 0)` }}>
      <div className="flex h-[55px] w-[55px] items-center justify-center rounded-full bg-white text-[11px] font-[700] text-[#0B1730]">
        {value}%
      </div>
    </div>
  );
}

function Quick({
  href,
  label,
  type,
  primary = false,
}: {
  href: string;
  label: string;
  type: "load" | "expense" | "fuel" | "maintenance";
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`fp-quick-row ${primary ? "fp-quick-row-primary" : ""}`}
    >
      <span className="fp-quick-left">
        <span className={`fp-quick-icon ${primary ? "fp-quick-icon-primary" : ""}`}>
          <QuickIcon type={type} />
        </span>
        <span>{label}</span>
      </span>

      <span className="fp-quick-arrow">›</span>
    </Link>
  );
}

function QuickIcon({
  type,
}: {
  type: "load" | "expense" | "fuel" | "maintenance";
}) {
  const common = {
    viewBox: "0 0 24 24",
    className: "h-[14px] w-[14px] fill-none stroke-current",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  if (type === "load") {
    return (
      <svg {...common}>
        <path d="M12 5v14M5 12h14" />
      </svg>
    );
  }

  if (type === "expense") {
    return (
      <svg {...common}>
        <path d="M6 3h12v18H6z" />
        <path d="M9 8h6M9 12h6M9 16h4" />
      </svg>
    );
  }

  if (type === "fuel") {
    return (
      <svg {...common}>
        <path d="M6 3h9v18H6z" />
        <path d="M8 7h5" />
        <path d="M15 8h2l2 3v6a2 2 0 0 0 2 2" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="M14.5 6a4 4 0 0 0-5 5L4 16.5 7.5 20l5.5-5.5a4 4 0 0 0 5-5L15.5 12 12 8.5 14.5 6Z" />
    </svg>
  );
}

function Activity({
  type,
  text,
  amount,
  when,
}: {
  type: "load" | "fuel" | "maintenance" | "expense";
  text: string;
  amount: string;
  when: string;
}) {
  const config = {
    load: { bg: CHART_PALETTE.navy, amount: CHART_PALETTE.green },
    fuel: { bg: CHART_PALETTE.green, amount: CHART_PALETTE.red },
    maintenance: { bg: CHART_PALETTE.purple, amount: CHART_PALETTE.red },
    expense: { bg: CHART_PALETTE.gray, amount: CHART_PALETTE.red },
  }[type];

  return (
    <div className="fp-activity-row">
      <div
        className="fp-activity-icon"
        style={{ backgroundColor: config.bg }}
      >
        <ActivityIcon type={type} />
      </div>

      <div className="fp-activity-text" title={text}>
        {text}
      </div>

      <div
        className="fp-activity-amount"
        style={{ color: config.amount }}
      >
        {amount}
      </div>

      <div className="fp-activity-time">
        {when}
      </div>
    </div>
  );
}

function ActivityIcon({
  type,
}: {
  type: "load" | "fuel" | "maintenance" | "expense";
}) {
  const common = {
    viewBox: "0 0 24 24",
    className: "h-[13px] w-[13px] fill-none stroke-white",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  if (type === "load") {
    return (
      <svg {...common}>
        <rect x="4" y="6" width="13" height="10" rx="1.5" />
        <path d="M17 9h2l2 3v4h-4" />
        <circle cx="8" cy="18" r="1.8" />
        <circle cx="18" cy="18" r="1.8" />
      </svg>
    );
  }

  if (type === "fuel") {
    return (
      <svg {...common}>
        <path d="M6 3h9v18H6z" />
        <path d="M8 7h5" />
        <path d="M15 8h2l2 3v6a2 2 0 0 0 2 2" />
      </svg>
    );
  }

  if (type === "maintenance") {
    return (
      <svg {...common}>
        <path d="M14.5 6a4 4 0 0 0-5 5L4 16.5 7.5 20l5.5-5.5a4 4 0 0 0 5-5L15.5 12 12 8.5 14.5 6Z" />
      </svg>
    );
  }


  return (
    <svg {...common}>
      <path d="M6 3h8l4 4v14H6z" />
      <path d="M14 3v5h5" />
      <path d="M9 13h6M9 17h6" />
    </svg>
  );
}

function FleetKpi({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: "truck" | "service" | "loads" | "miles";
}) {
  return (
    <div className="fp-fleet-kpi">
      <div className="fp-fleet-kpi-icon">
        <FleetKpiIcon type={icon} />
      </div>

      <div className="fp-number mt-2 text-[19px] font-[800] text-[#0B1730]">
        {value}
      </div>

      <div className="mt-1 text-[8px] font-[600] leading-[1.35] text-[#6d8096]">
        {label}
      </div>
    </div>
  );
}

function FleetKpiIcon({
  type,
}: {
  type: "truck" | "service" | "loads" | "miles";
}) {
  const common = {
    viewBox: "0 0 24 24",
    className: "h-[16px] w-[16px] fill-none stroke-[#16853B]",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  if (type === "truck") {
    return (
      <svg {...common}>
        <path d="M3 6h11v10H3z" />
        <path d="M14 9h4l3 3v4h-7z" />
        <circle cx="7" cy="18" r="2" />
        <circle cx="18" cy="18" r="2" />
      </svg>
    );
  }

  if (type === "service") {
    return (
      <svg {...common}>
        <path d="M14.5 6a4 4 0 0 0-5 5L4 16.5 7.5 20l5.5-5.5a4 4 0 0 0 5-5L15.5 12 12 8.5 14.5 6Z" />
      </svg>
    );
  }

  if (type === "loads") {
    return (
      <svg {...common}>
        <path d="M6 3h8l4 4v14H6z" />
        <path d="M14 3v5h5" />
        <path d="M9 13h6M9 17h6" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="M5 20 8 4M19 20 16 4" />
      <path d="M12 5v3M12 11v3M12 17v2" />
    </svg>
  );
}

function dot(index: number) {
  return ["bg-[#16853B]","bg-[#ff4e5b]","bg-[#43d89b]","bg-[#f23f95]","bg-[#6857cc]","bg-[#ffae35]"][index % 6];
}

function compactLocation(value?: string | null) {
  if (!value) return "—";

  const trimmed = value.trim();

  // Preserve city/state style while preventing long routes from dominating the row.
  const parts = trimmed.split(",").map((part) => part.trim()).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0]}, ${parts[1]}`;
  }

  return trimmed;
}

function shortDate(v?: string | null) {
  if (!v) return "—";
  return new Date(`${v.slice(0,10)}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
