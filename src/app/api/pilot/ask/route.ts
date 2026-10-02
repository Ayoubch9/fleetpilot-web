import { formatMoney } from "@/lib/format";
import { expenseCategoryLabel } from "@/lib/expense-taxonomy";
import { buildSettlementHistory } from "@/lib/settlement-history";
import { buildPilotDataCoverage, buildPilotWeeklySnapshots } from "@/lib/pilot-data";
import { dbDate, monday, plusDays, weekEnd } from "@/lib/fleetpilot-week";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getMileVoxaAccessEntitlement } from "@/lib/beta-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ChatMessage = {
  role: "user" | "assistant";
  text: string;
};

type LoadRow = {
  truck_id: string | null;
  load_number: string | null;
  broker: string | null;
  pickup: string | null;
  delivery: string | null;
  pickup_date: string | null;
  delivery_date: string | null;
  rate: number | string | null;
  loaded_miles: number | string | null;
  deadhead_miles: number | string | null;
  status: string | null;
};

type ExpenseRow = {
  truck_id: string | null;
  category: string | null;
  expense_date: string | null;
  amount: number | string | null;
  vendor: string | null;
  gallons: number | string | null;
  fuel_price_per_gallon: number | string | null;
};

type TruckRow = {
  id: string;
  unit_number: string | null;
  year: number | null;
  make: string | null;
  model: string | null;
  current_mileage: number | string | null;
  status: string | null;
};

type MaintenanceRow = {
  truck_id: string | null;
  service_type: string | null;
  service_date: string | null;
  mileage: number | string | null;
  cost: number | string | null;
  next_service_mileage: number | string | null;
  next_service_date: string | null;
};

const n = (value: unknown) => Number(value || 0) || 0;
const money = (value: number) => formatMoney(value);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const question = String(body?.question || "").trim();
    const history = Array.isArray(body?.history)
      ? (body.history as ChatMessage[]).slice(-8)
      : [];

    if (!question) {
      return NextResponse.json({ error: "Question is required." }, { status: 400 });
    }

    if (question.length > 2000) {
      return NextResponse.json({ error: "Question is too long." }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { data: membership } = await supabase
      .from("company_members")
      .select("company_id, role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!membership?.company_id) {
      return NextResponse.json(
        { error: "No MileVoxa company is linked to this account." },
        { status: 403 }
      );
    }

    const entitlement = await getMileVoxaAccessEntitlement(
      supabase,
      membership.company_id,
      user.created_at
    );

    if (!entitlement.allowed) {
      return NextResponse.json(
        { error: "Your MileVoxa access is not active." },
        { status: 403 }
      );
    }

    const [
      { data: profile },
      { data: company },
      { data: loadData, error: loadError },
      { data: expenseData, error: expenseError },
      { data: truckData, error: truckError },
      { data: maintenanceData, error: maintenanceError },
      { data: reimbursementData, error: reimbursementError },
      { data: fixedExpenseData, error: fixedExpenseError },
      { data: feeSettings, error: feeSettingsError },
      { data: odometerData, error: odometerError },
    ] = await Promise.all([
      supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
      supabase.from("companies").select("name").eq("id", membership.company_id).maybeSingle(),
      supabase
        .from("loads")
        .select(
          "truck_id, load_number, broker, pickup, delivery, pickup_date, delivery_date, rate, loaded_miles, deadhead_miles, status"
        )
        .order("pickup_date", { ascending: false }),
      supabase
        .from("expenses")
        .select(
          "truck_id, category, expense_date, amount, vendor, gallons, fuel_price_per_gallon"
        )
        .order("expense_date", { ascending: false }),
      supabase
        .from("trucks")
        .select("id, unit_number, year, make, model, current_mileage, status"),
      supabase
        .from("maintenance_records")
        .select(
          "truck_id, service_type, service_date, mileage, cost, next_service_mileage, next_service_date"
        )
        .order("service_date", { ascending: false })
        .limit(300),
      supabase
        .from("reimbursements")
        .select("amount, reimbursement_date")
        .order("reimbursement_date", { ascending: false }),
      supabase
        .from("weekly_fixed_expenses")
        .select("name, amount, is_active")
        .limit(100),
      supabase
        .from("company_fee_settings")
        .select(
          "revenue_fee_percent, mileage_fee_per_mile, is_revenue_fee_active, is_mileage_fee_active"
        )
        .maybeSingle(),
      supabase
        .from("weekly_odometer_records")
        .select("truck_id, week_start, start_odometer, end_odometer, rate_per_mile")
        .order("week_start", { ascending: false }),
    ]);

    const loads = (loadData ?? []) as LoadRow[];
    const expenses = (expenseData ?? []) as ExpenseRow[];
    const trucks = (truckData ?? []) as TruckRow[];
    const maintenance = (maintenanceData ?? []) as MaintenanceRow[];

    const totalRevenue = loads.reduce((sum, row) => sum + n(row.rate), 0);
    const loadedMiles = loads.reduce((sum, row) => sum + n(row.loaded_miles), 0);
    const deadheadMiles = loads.reduce((sum, row) => sum + n(row.deadhead_miles), 0);
    const totalMiles = loadedMiles + deadheadMiles;
    const totalExpenses = expenses.reduce((sum, row) => sum + n(row.amount), 0);
    const totalReimbursements = (reimbursementData ?? []).reduce(
      (sum, row) => sum + n(row.amount),
      0
    );
    const netVariableExpenses = totalExpenses - totalReimbursements;
    const fuelExpenses = expenses
      .filter((row) => (row.category || "").toLowerCase() === "fuel")
      .reduce((sum, row) => sum + n(row.amount), 0);
    const fuelGallons = expenses
      .filter((row) => (row.category || "").toLowerCase() === "fuel")
      .reduce((sum, row) => sum + n(row.gallons), 0);

    const expenseCategories = new Map<string, number>();
    for (const row of expenses) {
      const key = row.category || "Other";
      expenseCategories.set(key, (expenseCategories.get(key) || 0) + n(row.amount));
    }

    const topExpenseCategories = [...expenseCategories.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, amount]) => `${name}: ${money(amount)}`);

    const truckMap = new Map(trucks.map((truck) => [truck.id, truck]));
    const truckPerformance = trucks
      .map((truck) => {
        const truckLoads = loads.filter((load) => load.truck_id === truck.id);
        const revenue = truckLoads.reduce((sum, load) => sum + n(load.rate), 0);
        const miles = truckLoads.reduce(
          (sum, load) => sum + n(load.loaded_miles) + n(load.deadhead_miles),
          0
        );
        const expense = expenses
          .filter((row) => row.truck_id === truck.id)
          .reduce((sum, row) => sum + n(row.amount), 0);

        return {
          unit: truck.unit_number || truck.id.slice(0, 6),
          status: truck.status || "UNKNOWN",
          makeModel: [truck.year, truck.make, truck.model].filter(Boolean).join(" "),
          currentMileage: n(truck.current_mileage),
          revenue,
          expense,
          directProfit: revenue - expense,
          miles,
          loads: truckLoads.length,
        };
      })
      .sort((a, b) => b.directProfit - a.directProfit)
      .slice(0, 15);

    const routes = new Map<
      string,
      { loads: number; revenue: number; miles: number }
    >();
    for (const load of loads) {
      const key = `${load.pickup || "Unknown"} → ${load.delivery || "Unknown"}`;
      const current = routes.get(key) || { loads: 0, revenue: 0, miles: 0 };
      current.loads += 1;
      current.revenue += n(load.rate);
      current.miles += n(load.loaded_miles) + n(load.deadhead_miles);
      routes.set(key, current);
    }

    const topRoutes = [...routes.entries()]
      .map(([route, value]) => ({
        route,
        ...value,
        rpm: value.miles > 0 ? value.revenue / value.miles : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 12);

    const today = new Date();
    const upcomingMaintenance = maintenance
      .filter((record) => {
        const truck = record.truck_id ? truckMap.get(record.truck_id) : undefined;
        const byDate =
          record.next_service_date &&
          new Date(`${record.next_service_date}T12:00:00`) >= today;
        const byMileage =
          record.next_service_mileage &&
          truck &&
          n(record.next_service_mileage) >= n(truck.current_mileage);
        return Boolean(byDate || byMileage);
      })
      .slice(0, 20)
      .map((record) => {
        const truck = record.truck_id ? truckMap.get(record.truck_id) : undefined;
        return {
          truck: truck?.unit_number || "Unknown",
          service: record.service_type || "Service",
          nextDate: record.next_service_date,
          nextMileage: record.next_service_mileage,
          currentMileage: truck?.current_mileage,
        };
      });

    const fixedExpenses = (fixedExpenseData ?? [])
      .filter((row) => row.is_active !== false)
      .map((row) => `${row.name || "Fixed expense"}: ${money(n(row.amount))}`);

    const latestLoads = loads.slice(0, 20).map((load) => ({
      number: load.load_number,
      broker: load.broker,
      route: `${load.pickup || "Unknown"} → ${load.delivery || "Unknown"}`,
      pickupDate: load.pickup_date,
      deliveryDate: load.delivery_date,
      rate: n(load.rate),
      totalMiles: n(load.loaded_miles) + n(load.deadhead_miles),
      trueRpm:
        n(load.loaded_miles) + n(load.deadhead_miles) > 0
          ? n(load.rate) / (n(load.loaded_miles) + n(load.deadhead_miles))
          : 0,
      status: load.status,
      truck: load.truck_id ? truckMap.get(load.truck_id)?.unit_number : null,
    }));

    const settlementHistory = buildSettlementHistory({
      loads,
      expenses,
      reimbursements: reimbursementData ?? [],
      fixedExpenses: fixedExpenseData ?? [],
      odometers: odometerData ?? [],
      settings: feeSettings ?? undefined,
      maxWeeks: 52,
    });

    const weeklyOperations = buildPilotWeeklySnapshots({
      loads,
      expenses,
      reimbursements: reimbursementData ?? [],
      odometers: odometerData ?? [],
      maintenance,
      trucks,
      defaultMileageRate:
        feeSettings?.mileage_fee_per_mile == null
          ? 0.15
          : n(feeSettings.mileage_fee_per_mile),
      maxWeeks: 104,
    });

    const dataCoverage = buildPilotDataCoverage({
      loads,
      expenses,
      reimbursements: reimbursementData ?? [],
      odometers: odometerData ?? [],
      maintenance,
    });

    const sourceStatus = {
      loads: loadError ? "unavailable" : "available",
      expenses: expenseError ? "unavailable" : "available",
      trucks: truckError ? "unavailable" : "available",
      maintenance: maintenanceError ? "unavailable" : "available",
      reimbursements: reimbursementError ? "unavailable" : "available",
      fixedExpenses: fixedExpenseError ? "unavailable" : "available",
      feeSettings: feeSettingsError ? "unavailable" : "available",
      odometers: odometerError ? "unavailable" : "available",
    };

    const recentFuelPurchases = expenses
      .filter((row) => expenseCategoryLabel(row.category) === "Fuel")
      .slice(0, 100)
      .map((row) => ({
        date: row.expense_date,
        truck: row.truck_id ? truckMap.get(row.truck_id)?.unit_number || null : null,
        vendor: row.vendor || null,
        gallons: n(row.gallons),
        amount: n(row.amount),
        pricePerGallon:
          n(row.gallons) > 0
            ? n(row.amount) / n(row.gallons)
            : n(row.fuel_price_per_gallon) || null,
      }));

    const asOf = new Date();
    const currentWeekStartDate = monday(asOf);
    const previousWeekStartDate = plusDays(currentWeekStartDate, -7);

    const timeContext = {
      asOfDate: dbDate(asOf),
      weekDefinition: "Monday through Sunday",
      currentWeek: {
        start: dbDate(currentWeekStartDate),
        end: dbDate(weekEnd(currentWeekStartDate)),
      },
      previousWeek: {
        start: dbDate(previousWeekStartDate),
        end: dbDate(weekEnd(previousWeekStartDate)),
      },
    };

    const recentExpenseRecords = expenses.slice(0, 150).map((row) => ({
      date: row.expense_date,
      category: expenseCategoryLabel(row.category),
      truck: row.truck_id
        ? truckMap.get(row.truck_id)?.unit_number || null
        : null,
      vendor: row.vendor || null,
      amount: n(row.amount),
      gallons: n(row.gallons),
      pricePerGallon:
        n(row.gallons) > 0
          ? n(row.amount) / n(row.gallons)
          : n(row.fuel_price_per_gallon) || null,
    }));

    const context = {
      time: timeContext,
      account: {
        userName: profile?.full_name || "MileVoxa User",
        company: company?.name || "MileVoxa Company",
        role: membership.role || "Member",
      },
      totals: {
        recordedLoads: loads.length,
        totalRevenue,
        loadedMiles,
        deadheadMiles,
        totalMiles,
        totalExpenses,
        totalReimbursements,
        netVariableExpenses,
        fuelExpenses,
        fuelGallons,
        activeTrucks: trucks.filter(
          (truck) => (truck.status || "ACTIVE").toUpperCase() !== "INACTIVE"
        ).length,
        fleetSize: trucks.length,
      },
      topExpenseCategories,
      truckPerformance,
      topRoutes,
      upcomingMaintenance,
      fixedExpenses,
      feeSettings: feeSettings ?? null,
      sourceStatus,
      dataCoverage,
      weeklyOperations: {
        basis:
          "Calendar weeks run Monday through Sunday. Fuel gallons/spend, variable expenses, reimbursements, odometer mileage, mileage expense, maintenance, load count, revenue and load miles are grouped by their recorded dates.",
        weeks: weeklyOperations,
      },
      recentFuelPurchases,
      recentExpenseRecords,
      latestOdometerRecords: (odometerData ?? []).slice(0, 20),
      latestLoads,
      settlementHistory: {
        readOnly: true,
        basis:
          "Reconciled with the same MileVoxa weekly settlement calculation: weekly revenue, reimbursements, active weekly fixed costs, company fees, odometer mileage and operating expenses.",
        citationLabel: "Based on your settlements",
        weeks: settlementHistory,
      },
    };

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "Pilot AI is not configured yet. Add OPENAI_API_KEY to the server environment.",
          code: "PILOT_AI_NOT_CONFIGURED",
        },
        { status: 503 }
      );
    }

    const model = process.env.OPENAI_MODEL || "gpt-5.6-luna";
    const conversation = history
      .filter(
        (message) =>
          message &&
          (message.role === "user" || message.role === "assistant") &&
          typeof message.text === "string"
      )
      .map((message) => `${message.role.toUpperCase()}: ${message.text}`)
      .join("\n\n");

    const instructions = [
      "You are Pilot AI inside MileVoxa, a trucking business management application.",
      "Give practical, data-rich answers grounded ONLY in the supplied MileVoxa company data.",
      "Never invent loads, trucks, costs, dates, rates, vendors, routes, gallons, maintenance items, mileage, or financial values.",
      "If a data source is marked unavailable in context.sourceStatus, say that source is unavailable instead of treating it as zero.",
      "If a requested date or week is outside context.dataCoverage, say the available coverage does not include that period.",
      "Use context.time to resolve relative periods such as this week and last week. Calendar weeks run Monday through Sunday and are identified by weekStart/weekEnd.",
      "For questions about fuel consumed, fuel gallons, fuel spend, average fuel price, or fuel by truck in a specific week, use context.weeklyOperations.weeks as the authoritative source. Do not use all-time fuel totals for a weekly question.",
      "For detailed recent fuel-purchase questions, use context.recentFuelPurchases when it contains the requested date or transaction.",
      "For questions about a week, weekly expenses, weekly mileage, odometer miles, mileage expense, load count, revenue, maintenance, or reimbursements, use context.weeklyOperations.weeks first.",
      "For weekly profit, best/worst/profitable week, or settlement history, use context.settlementHistory.weeks as the authoritative source.",
      "When the user says 'fuel consumed', report gallons when gallons are recorded. Also report fuel spend and average price per gallon when available. If gallons are zero because gallon values were not recorded, say that explicitly rather than claiming no fuel was consumed.",
      "Reimbursements offset expenses; do not treat them as revenue.",
      "Differentiate direct truck profit (truck revenue minus directly assigned expenses) from full company net profit because company fixed expenses and company fees may not be allocated by truck.",
      "Settlement history is read-only. Never imply that Pilot AI changed, reconciled, approved, or wrote settlement records.",
      "When an answer uses settlementHistory, include a clear source line containing the exact phrase 'Based on your settlements' and identify the relevant week or weeks.",
      "For weekly operational answers, identify the exact Monday-Sunday date range you used.",
      "When useful, break the answer down by truck and expense category instead of giving only a single total.",
      "When recommending actions, explain the business reason and reference relevant numbers when available.",
      "Do not expose database IDs, internal implementation details, API keys, or security configuration.",
      "Keep most answers under 500 words unless the user explicitly asks for a detailed analysis.",
      "Use plain text with short headings or bullets when useful.",
    ].join(" ");

    const input = [
      conversation ? `Recent conversation:\n${conversation}\n\n` : "",
      `Current MileVoxa company data:\n${JSON.stringify(context)}`,
      `\n\nUser question:\n${question}`,
    ].join("");

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        instructions,
        input,
        max_output_tokens: 900,
      }),
      cache: "no-store",
    });

    const payload = await response.json();

    if (!response.ok) {
      console.error("Pilot AI OpenAI error:", payload);
      const apiMessage =
        payload?.error?.message ||
        "Pilot AI could not generate an answer right now.";
      return NextResponse.json({ error: apiMessage }, { status: 502 });
    }

    const rawAnswer =
      extractOutputText(payload) ||
      "Pilot AI completed the request but returned no text response.";

    const settlementHistoryIntent =
      /\b(settlement|settlements|profitable week|best week|worst week|weekly profit)\b/i.test(
        question
      );

    const weeklyOperationsIntent =
      /\b(fuel|gallons?|week|weekly|odometer|mileage|miles|expenses?|reimbursements?|maintenance|loads?)\b/i.test(
        question
      );

    let answer = rawAnswer;

    if (
      settlementHistoryIntent &&
      settlementHistory.length > 0 &&
      !/based on your settlements/i.test(answer)
    ) {
      answer = `${answer}\n\nSource: Based on your settlements (MileVoxa reconciled weekly metrics).`;
    } else if (
      weeklyOperationsIntent &&
      weeklyOperations.length > 0 &&
      !/based on your milevoxa data/i.test(answer)
    ) {
      answer = `${answer}\n\nSource: Based on your MileVoxa data (weekly operational records).`;
    }

    return NextResponse.json({
      answer,
      model,
      generatedAt: new Date().toISOString(),
      settlementHistoryReadOnly: true,
    });
  } catch (error) {
    console.error("Pilot AI route error:", error);
    return NextResponse.json(
      { error: "Pilot AI encountered an unexpected server error." },
      { status: 500 }
    );
  }
}

function extractOutputText(payload: any) {
  if (typeof payload?.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  const pieces: string[] = [];
  for (const item of payload?.output ?? []) {
    if (item?.type !== "message") continue;
    for (const content of item?.content ?? []) {
      if (
        content?.type === "output_text" &&
        typeof content?.text === "string"
      ) {
        pieces.push(content.text);
      }
    }
  }

  return pieces.join("\n").trim();
}
