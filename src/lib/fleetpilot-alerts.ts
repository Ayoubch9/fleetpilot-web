import type { SupabaseClient } from "@supabase/supabase-js";

export type FleetPilotAlert = {
  id: string;
  category: "maintenance" | "documents" | "loads";
  severity: "critical" | "warning" | "info";
  title: string;
  description: string;
  href: string;
  dateLabel?: string;
  sortDate: string;
};

type Truck = {
  id: string;
  unit_number: string | null;
  current_mileage: number | string | null;
};

const n = (value: unknown) => Number(value || 0) || 0;

export async function getFleetPilotAlerts(
  supabase: SupabaseClient
): Promise<FleetPilotAlert[]> {
  const today = startOfDay(new Date());
  const thirtyDays = addDays(today, 30);
  const twoDays = addDays(today, 2);

  const [
    truckResult,
    maintenanceResult,
    documentResult,
    loadResult,
    preferenceResult,
  ] = await Promise.all([
    supabase
      .from("trucks")
      .select("id, unit_number, current_mileage"),
    supabase
      .from("maintenance_records")
      .select(
        "id, truck_id, service_type, next_service_date, next_service_mileage"
      )
      .limit(500),
    supabase
      .from("documents")
      .select("id, name, document_type, truck_id, expiration_date")
      .limit(500),
    supabase
      .from("loads")
      .select(
        "id, load_number, pickup, delivery, pickup_date, status, truck_id"
      )
      .order("pickup_date", { ascending: true })
      .limit(300),
    supabase
      .from("user_preferences")
      .select("notify_load_updates, notify_maintenance")
      .maybeSingle(),
  ]);

  const trucks = (truckResult.data ?? []) as Truck[];
  const truckMap = new Map(trucks.map((truck) => [truck.id, truck]));

  const notifyMaintenance =
    preferenceResult.data?.notify_maintenance !== false;
  const notifyLoads =
    preferenceResult.data?.notify_load_updates !== false;

  const alerts: FleetPilotAlert[] = [];

  if (notifyMaintenance) {
    for (const record of maintenanceResult.data ?? []) {
      const truck = record.truck_id
        ? truckMap.get(record.truck_id)
        : undefined;
      const unit = truck?.unit_number
        ? `Truck #${truck.unit_number}`
        : "Truck";
      const service = record.service_type || "Maintenance";

      if (record.next_service_date) {
        const due = startOfDay(
          new Date(`${record.next_service_date}T12:00:00`)
        );

        if (due < today) {
          alerts.push({
            id: `maintenance-date-overdue-${record.id}`,
            category: "maintenance",
            severity: "critical",
            title: `${service} overdue`,
            description: `${unit} was due for ${service.toLowerCase()} on ${formatDate(
              due
            )}.`,
            href: "/maintenance",
            dateLabel: formatDate(due),
            sortDate: due.toISOString(),
          });
        } else if (due <= thirtyDays) {
          alerts.push({
            id: `maintenance-date-soon-${record.id}`,
            category: "maintenance",
            severity: "warning",
            title: `${service} due soon`,
            description: `${unit} is due for ${service.toLowerCase()} on ${formatDate(
              due
            )}.`,
            href: "/maintenance",
            dateLabel: formatDate(due),
            sortDate: due.toISOString(),
          });
        }
      }

      if (
        record.next_service_mileage != null &&
        truck?.current_mileage != null
      ) {
        const dueMileage = n(record.next_service_mileage);
        const currentMileage = n(truck.current_mileage);
        const remaining = dueMileage - currentMileage;

        if (remaining < 0) {
          alerts.push({
            id: `maintenance-mileage-overdue-${record.id}`,
            category: "maintenance",
            severity: "critical",
            title: `${service} mileage overdue`,
            description: `${unit} is ${Math.abs(
              Math.round(remaining)
            ).toLocaleString()} miles past its ${Math.round(
              dueMileage
            ).toLocaleString()}-mile service threshold.`,
            href: "/maintenance",
            sortDate: today.toISOString(),
          });
        } else if (remaining <= 1000) {
          alerts.push({
            id: `maintenance-mileage-soon-${record.id}`,
            category: "maintenance",
            severity: "warning",
            title: `${service} mileage approaching`,
            description: `${unit} has about ${Math.round(
              remaining
            ).toLocaleString()} miles remaining before ${service.toLowerCase()}.`,
            href: "/maintenance",
            sortDate: today.toISOString(),
          });
        }
      }
    }
  }

  if (!documentResult.error) {
    for (const doc of documentResult.data ?? []) {
      if (!doc.expiration_date) continue;

      const expiration = startOfDay(
        new Date(`${doc.expiration_date}T12:00:00`)
      );
      const documentName =
        doc.name || doc.document_type || "Document";
      const truck = doc.truck_id
        ? truckMap.get(doc.truck_id)
        : undefined;
      const subject = truck?.unit_number
        ? `Truck #${truck.unit_number}`
        : "Company";

      if (expiration < today) {
        alerts.push({
          id: `document-expired-${doc.id}`,
          category: "documents",
          severity: "critical",
          title: `${documentName} expired`,
          description: `${subject} document expired on ${formatDate(
            expiration
          )}.`,
          href: "/documents",
          dateLabel: formatDate(expiration),
          sortDate: expiration.toISOString(),
        });
      } else if (expiration <= thirtyDays) {
        alerts.push({
          id: `document-expiring-${doc.id}`,
          category: "documents",
          severity: "warning",
          title: `${documentName} expires soon`,
          description: `${subject} document expires on ${formatDate(
            expiration
          )}.`,
          href: "/documents",
          dateLabel: formatDate(expiration),
          sortDate: expiration.toISOString(),
        });
      }
    }
  }

  if (notifyLoads) {
    for (const load of loadResult.data ?? []) {
      if (!load.pickup_date) continue;

      const status = String(load.status || "").toUpperCase();
      if (
        ["COMPLETED", "DELIVERED", "CANCELLED", "CANCELED"].includes(
          status
        )
      ) {
        continue;
      }

      const pickupDate = startOfDay(
        new Date(`${load.pickup_date}T12:00:00`)
      );

      const loadName = load.load_number
        ? `Load #${load.load_number}`
        : "Load";
      const route = `${load.pickup || "Unknown"} → ${
        load.delivery || "Unknown"
      }`;

      if (pickupDate < today) {
        alerts.push({
          id: `load-past-pickup-${load.id}`,
          category: "loads",
          severity: "critical",
          title: `${loadName} needs attention`,
          description: `${route} has a pickup date of ${formatDate(
            pickupDate
          )} but is still ${status || "open"}.`,
          href: "/loads",
          dateLabel: formatDate(pickupDate),
          sortDate: pickupDate.toISOString(),
        });
      } else if (pickupDate <= twoDays) {
        alerts.push({
          id: `load-upcoming-${load.id}`,
          category: "loads",
          severity: "info",
          title: `${loadName} pickup approaching`,
          description: `${route} is scheduled for pickup on ${formatDate(
            pickupDate
          )}.`,
          href: "/loads",
          dateLabel: formatDate(pickupDate),
          sortDate: pickupDate.toISOString(),
        });
      }
    }
  }

  const severityRank = {
    critical: 0,
    warning: 1,
    info: 2,
  } as const;

  return alerts
    .filter(
      (alert, index, all) =>
        all.findIndex((item) => item.id === alert.id) === index
    )
    .sort((a, b) => {
      const severityDifference =
        severityRank[a.severity] - severityRank[b.severity];

      if (severityDifference !== 0) return severityDifference;

      return a.sortDate.localeCompare(b.sortDate);
    });
}

function startOfDay(date: Date) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );
}

function addDays(date: Date, days: number) {
  const value = new Date(date);
  value.setDate(value.getDate() + days);
  return value;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}
