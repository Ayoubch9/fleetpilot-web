import AppShell from "@/components/app-shell";
import { getMileVoxaAccount } from "@/lib/fleetpilot-account";
import {
  dbDate,
  displayDate,
  selectedWeek,
  weekEnd,
} from "@/lib/fleetpilot-week";
import OdometerManager from "./odometer-manager";

type SearchParams = Promise<{
  week?: string;
}>;

type TruckRow = {
  id: string;
  unit_number: string | null;
  make: string | null;
  model: string | null;
  current_mileage: number | string | null;
  status: string | null;
};

type OdometerRow = {
  truck_id: string | null;
  week_start: string | null;
  start_odometer: number | string | null;
  end_odometer: number | string | null;
  rate_per_mile: number | string | null;
};

type FeeRow = {
  mileage_fee_per_mile?: number | string | null;
  is_mileage_fee_active?: boolean | null;
};

export default async function OdometerPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const { supabase, fullName, companyName, role } =
    await getMileVoxaAccount();

  const start = selectedWeek(params.week);
  const weekStart = dbDate(start);
  const sunday = weekEnd(start);

  const [truckResult, odometerResult, feeResult] = await Promise.all([
    supabase
      .from("trucks")
      .select("id, unit_number, make, model, current_mileage, status")
      .order("unit_number"),
    supabase
      .from("weekly_odometer_records")
      .select(
        "truck_id, week_start, start_odometer, end_odometer, rate_per_mile"
      )
      .eq("week_start", weekStart),
    supabase.from("company_fee_settings").select("*").limit(1).maybeSingle(),
  ]);

  const trucks = ((truckResult.data ?? []) as TruckRow[]).filter(
    (truck) => String(truck.status || "ACTIVE").toUpperCase() !== "INACTIVE"
  );

  const records = (odometerResult.data ?? []) as OdometerRow[];
  const feeSettings = (feeResult.data ?? null) as FeeRow | null;

  const rate =
    feeSettings?.mileage_fee_per_mile == null
      ? 0.15
      : Number(feeSettings.mileage_fee_per_mile);

  const mileageFeeActive =
    feeSettings?.is_mileage_fee_active == null
      ? true
      : Boolean(feeSettings.is_mileage_fee_active);

  return (
    <AppShell
      active="odometer"
      fullName={fullName}
      companyName={companyName}
      role={role}
    >
      <div className="fp-odometer-page">
        <section className="fp-odometer-heading">
          <div>
            <span>WEEKLY MILEAGE</span>
            <h1>Weekly Odometer</h1>
            <p>
              Enter each truck&apos;s starting and ending odometer once per
              week. MileVoxa uses the difference for the company mileage fee.
            </p>
          </div>

          <div className="fp-odometer-week-card">
            <span>SELECTED WEEK</span>
            <strong>
              {displayDate(start)} – {displayDate(sunday)}
            </strong>
            <small>{weekStart}</small>
          </div>
        </section>

        {(truckResult.error || odometerResult.error || feeResult.error) && (
          <div className="fp-odometer-warning">
            Some odometer sources could not be loaded. Refresh the page before
            saving weekly mileage.
          </div>
        )}

        <OdometerManager
          weekStart={weekStart}
          weekLabel={`${displayDate(start)} – ${displayDate(sunday)}`}
          mileageRate={Number.isFinite(rate) ? rate : 0.15}
          mileageFeeActive={mileageFeeActive}
          trucks={trucks.map((truck) => ({
            id: truck.id,
            unitNumber: truck.unit_number || "Truck",
            make: truck.make || "",
            model: truck.model || "",
            currentMileage:
              truck.current_mileage == null
                ? null
                : Number(truck.current_mileage),
          }))}
          records={records.map((row) => ({
            truckId: row.truck_id || "",
            startOdometer:
              row.start_odometer == null
                ? null
                : Number(row.start_odometer),
            endOdometer:
              row.end_odometer == null ? null : Number(row.end_odometer),
            ratePerMile:
              row.rate_per_mile == null ? null : Number(row.rate_per_mile),
          }))}
        />
      </div>
    </AppShell>
  );
}
