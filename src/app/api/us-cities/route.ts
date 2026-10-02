import { NextRequest, NextResponse } from "next/server";
import { City, State } from "country-state-city";

type CitySuggestion = {
  city: string;
  state: string;
  stateName: string;
  label: string;
};

let cachedUsCities: CitySuggestion[] | null = null;

function cleanCityName(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";

  return trimmed
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function buildUsCityIndex() {
  if (cachedUsCities) return cachedUsCities;

  const stateNameByCode = new Map(
    State.getStatesOfCountry("US").map((state) => [
      state.isoCode,
      state.name,
    ])
  );

  const usCities = City.getCitiesOfCountry("US") ?? [];

  cachedUsCities = usCities
    .map((city) => {
      const cityName = cleanCityName(city.name);
      const stateCode = city.stateCode || "";
      const stateName =
        stateNameByCode.get(stateCode) || stateCode;

      return {
        city: cityName,
        state: stateCode,
        stateName,
        label: `${cityName}, ${stateCode}`,
      };
    })
    .filter((row) => row.city && row.state)
    .sort(
      (a, b) =>
        a.city.localeCompare(b.city) ||
        a.state.localeCompare(b.state)
    );

  return cachedUsCities;
}

export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get("q") || "")
    .trim()
    .toLowerCase();

  if (q.length < 2) {
    return NextResponse.json({ suggestions: [] });
  }

  const normalized = q.replace(/\s+/g, " ");
  const rows = buildUsCityIndex();

  const suggestions = rows
    .filter((row) => {
      const city = row.city.toLowerCase();
      const state = row.state.toLowerCase();
      const label = row.label.toLowerCase();

      return (
        city.startsWith(normalized) ||
        label.startsWith(normalized) ||
        `${city} ${state}`.startsWith(normalized)
      );
    })
    .slice(0, 8);

  return NextResponse.json(
    { suggestions },
    {
      headers: {
        "Cache-Control":
          "public, max-age=3600, stale-while-revalidate=86400",
      },
    }
  );
}
