export type ToolKey = "cpm" | "load" | "owner" | "lease" | "fuel" | "rpm";

export type ToolDefinition = {
  key: ToolKey;
  slug: string;
  title: string;
  text: string;
  metaTitle: string;
  metaDescription: string;
};

export const TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    key: "cpm",
    slug: "cost-per-mile",
    title: "Trucking Cost Per Mile",
    text: "Know what every operating mile really costs.",
    metaTitle: "Trucking Cost Per Mile Calculator",
    metaDescription:
      "Calculate trucking cost per mile from weekly fuel, maintenance, fixed costs, other expenses, and total miles.",
  },
  {
    key: "load",
    slug: "load-profit",
    title: "Load Profit Calculator",
    text: "Estimate profit before you accept the load.",
    metaTitle: "Load Profit Calculator",
    metaDescription:
      "Estimate trucking load profit, true rate per mile, direct costs, profit per mile, and margin before accepting a load.",
  },
  {
    key: "owner",
    slug: "owner-operator-profit",
    title: "Owner-Operator Profit",
    text: "Turn weekly revenue and expenses into real take-home profit.",
    metaTitle: "Owner-Operator Profit Calculator",
    metaDescription:
      "Estimate owner-operator weekly net profit, total costs, profit margin, and monthly run rate from your trucking numbers.",
  },
  {
    key: "lease",
    slug: "lease-operator",
    title: "Lease Operator / Contractor",
    text: "Estimate weekly take-home for a driver leasing a truck.",
    metaTitle: "Lease Operator Profit Calculator",
    metaDescription:
      "Estimate lease-operator or contractor-driver take-home after truck lease, fuel, insurance, company fees, maintenance reserve, and deductions.",
  },
  {
    key: "fuel",
    slug: "fuel-cost",
    title: "Fuel Cost Calculator",
    text: "Estimate fuel gallons, spend and fuel cost per mile.",
    metaTitle: "Truck Fuel Cost Calculator",
    metaDescription:
      "Estimate truck fuel gallons, total fuel spend, and fuel cost per mile from mileage, MPG, and diesel price.",
  },
  {
    key: "rpm",
    slug: "rate-per-mile",
    title: "Rate Per Mile Calculator",
    text: "Compare loaded RPM and true RPM including deadhead.",
    metaTitle: "Truck Rate Per Mile Calculator",
    metaDescription:
      "Calculate loaded rate per mile and true rate per mile including deadhead miles for a trucking load.",
  },
];

export function toolDefinitionFromSlug(slug: string) {
  return TOOL_DEFINITIONS.find((tool) => tool.slug === slug);
}
