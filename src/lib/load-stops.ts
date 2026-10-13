export type LoadStopKind = "PICKUP" | "DELIVERY" | "STOP";
export type LoadStopTimeCertainty = "SCHEDULED" | "ANYTIME" | "TBD";

export type LoadStop = {
  id: string;
  kind: LoadStopKind;
  facility: string;
  location: string;
  appointmentDate: string;
  appointmentTime: string;
  timeCertainty: LoadStopTimeCertainty;
  instructions: string;
};

export type LegacyLoadRoute = {
  pickup: string | null;
  delivery: string | null;
  pickup_date: string | null;
  delivery_date: string | null;
};

export function isMissingRouteStopsColumn(
  error: { code?: string | null; message?: string | null } | null | undefined
) {
  return Boolean(
    error &&
      /route_stops/i.test(error.message || "") &&
      (error.code === "42703" || error.code === "PGRST204")
  );
}

export function createEmptyLoadStop(kind: LoadStopKind = "STOP"): LoadStop {
  return {
    id: `stop-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    kind,
    facility: "",
    location: "",
    appointmentDate: "",
    appointmentTime: "",
    timeCertainty: "TBD",
    instructions: "",
  };
}

function isLoadStop(value: unknown, index: number): value is LoadStop {
  if (!value || typeof value !== "object") return false;
  const stop = value as Partial<LoadStop>;
  return (
    typeof stop.location === "string" &&
    ["PICKUP", "DELIVERY", "STOP"].includes(String(stop.kind)) &&
    (stop.facility == null || typeof stop.facility === "string") &&
    (stop.appointmentDate == null || typeof stop.appointmentDate === "string") &&
    (stop.appointmentTime == null || typeof stop.appointmentTime === "string") &&
    (stop.instructions == null || typeof stop.instructions === "string") &&
    (stop.timeCertainty == null || ["SCHEDULED", "ANYTIME", "TBD"].includes(String(stop.timeCertainty))) &&
    (stop.id == null || typeof stop.id === "string") &&
    index >= 0
  );
}

export function normalizeLoadStops(value: unknown): LoadStop[] {
  if (!Array.isArray(value) || value.length < 2 || value.length > 20) return [];
  if (!value.every((stop, index) => isLoadStop(stop, index))) return [];

  return value.map((value, index) => {
    const stop = value as Partial<LoadStop>;
    return {
      id: stop.id || `stop-${index + 1}`,
      kind: stop.kind as LoadStopKind,
      facility: stop.facility || "",
      location: (stop.location || "").trim(),
      appointmentDate: stop.appointmentDate || "",
      appointmentTime: stop.appointmentTime || "",
      timeCertainty: stop.timeCertainty || "TBD",
      instructions: stop.instructions || "",
    };
  });
}

export function getLoadStops(
  value: unknown,
  legacy: LegacyLoadRoute
): LoadStop[] {
  const stops = normalizeLoadStops(value);
  if (stops.length) return stops;

  return [
    {
      id: "legacy-pickup",
      kind: "PICKUP",
      facility: "",
      location: legacy.pickup || "",
      appointmentDate: legacy.pickup_date?.slice(0, 10) || "",
      appointmentTime: "",
      timeCertainty: "TBD",
      instructions: "",
    },
    {
      id: "legacy-delivery",
      kind: "DELIVERY",
      facility: "",
      location: legacy.delivery || "",
      appointmentDate: legacy.delivery_date?.slice(0, 10) || "",
      appointmentTime: "",
      timeCertainty: "TBD",
      instructions: "",
    },
  ];
}

export function validateLoadStops(stops: LoadStop[]): string | null {
  if (stops.length < 2) return "A load needs at least a pickup and delivery stop.";
  if (stops.length > 20) return "A load can have up to 20 stops.";
  if (stops[0].kind !== "PICKUP") return "The first stop must be a pickup.";
  if (stops[stops.length - 1].kind !== "DELIVERY") {
    return "The last stop must be a delivery.";
  }
  if (stops.some((stop) => !stop.location.trim())) {
    return "Add a location for every stop.";
  }
  if (!stops[0].appointmentDate || !stops[stops.length - 1].appointmentDate) {
    return "Add the pickup and final delivery dates.";
  }
  return null;
}

export function legacyLoadEndpoints(stops: LoadStop[]) {
  return {
    pickup: stops[0]?.location.trim() || "",
    pickupDate: stops[0]?.appointmentDate || "",
    delivery: stops[stops.length - 1]?.location.trim() || "",
    deliveryDate: stops[stops.length - 1]?.appointmentDate || "",
  };
}
