import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
const money = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);

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
        { error: "No FleetPilot company is linked to this account." },
        { status: 403 }
      );
    }

    const [
      { data: profile },
      { data: company },
      { data: loadData },
      { data: expenseData },
      { data: truckData },
      { data: maintenanceData },
      { data: reimbursementData },
      { data: fixedExpenseData },
      { data: feeSettings },
      { data: odometerData },
    ] = await Promise.all([
      supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
      supabase.from("companies").select("name").eq("id", membership.company_id).maybeSingle(),
      supabase
        .from("loads")
        .select(
          "truck_id, load_number, broker, pickup, delivery, pickup_date, delivery_date, rate, loaded_miles, deadhead_miles, status"
        )
        .order("pickup_date", { ascending: false })
        .limit(300),
      supabase
        .from("expenses")
        .select(
          "truck_id, category, expense_date, amount, vendor, gallons, fuel_price_per_gallon"
        )
        .order("expense_date", { ascending: false })
        .limit(600),
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
        .order("reimbursement_date", { ascending: false })
        .limit(300),
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
        .order("week_start", { ascending: false })
        .limit(100),
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

    const context = {
      account: {
        userName: profile?.full_name || "FleetPilot User",
        company: company?.name || "FleetPilot Company",
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
      latestOdometerRecords: (odometerData ?? []).slice(0, 20),
      latestLoads,
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
      "You are Pilot AI inside FleetPilot, a trucking business management application.",
      "Give concise, practical business answers grounded ONLY in the supplied FleetPilot company data.",
      "Never invent loads, trucks, costs, dates, rates, vendors, routes, maintenance items, or financial values.",
      "If the data does not support a requested conclusion, say that clearly and explain what additional data would be needed.",
      "Reimbursements offset expenses; do not treat them as revenue.",
      "Differentiate direct truck profit (truck revenue minus directly assigned expenses) from full company net profit because company fixed expenses and company fees may not be allocated by truck.",
      "When recommending actions, explain the business reason and reference relevant numbers when available.",
      "Do not expose database IDs, internal implementation details, API keys, or security configuration.",
      "Keep most answers under 350 words unless the user explicitly asks for a detailed analysis.",
      "Use plain text with short headings or bullets when useful.",
    ].join(" ");

    const input = [
      conversation ? `Recent conversation:\n${conversation}\n\n` : "",
      `Current FleetPilot company data:\n${JSON.stringify(context)}`,
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

    const answer =
      extractOutputText(payload) ||
      "Pilot AI completed the request but returned no text response.";

    return NextResponse.json({
      answer,
      model,
      generatedAt: new Date().toISOString(),
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
