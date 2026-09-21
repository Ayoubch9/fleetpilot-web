export const CHART_PALETTE = {
  navy: "#102238",
  green: "#16853B",
  red: "#DC2626",
  amber: "#EA580C",
  gray: "#64748B",
  purple: "#7C3AED",
} as const;

export type ChartPaletteKey = keyof typeof CHART_PALETTE;

export const CHART_CATEGORY_COLORS = [
  CHART_PALETTE.green,
  CHART_PALETTE.navy,
  CHART_PALETTE.amber,
  CHART_PALETTE.purple,
  CHART_PALETTE.gray,
] as const;

export function chartCategoryColor(index: number) {
  return CHART_CATEGORY_COLORS[index % CHART_CATEGORY_COLORS.length];
}
