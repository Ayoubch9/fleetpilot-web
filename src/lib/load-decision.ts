export type LoadDecisionRating = "good" | "marginal" | "poor";

export type LoadDecisionInput = {
  rate: number;
  loadedMiles: number;
  deadheadMiles: number;
  fuelPrice: number;
  mpg: number;
  operatingCostPerMile: number;
  targetAllMileRpm: number;
};

export type LoadDecisionResult = {
  totalMiles: number;
  grossRpm: number;
  allMileRpm: number;
  fuelGallons: number;
  fuelCost: number;
  operatingCost: number;
  estimatedProfit: number;
  profitPerMile: number;
  marginPercent: number;
  deadheadPercent: number;
  rating: LoadDecisionRating;
  reasons: string[];
};

const finite = (value: number) => Number.isFinite(value) ? value : 0;

export function analyzeLoadDecision(input: LoadDecisionInput): LoadDecisionResult {
  const rate = Math.max(0, finite(input.rate));
  const loadedMiles = Math.max(0, finite(input.loadedMiles));
  const deadheadMiles = Math.max(0, finite(input.deadheadMiles));
  const totalMiles = loadedMiles + deadheadMiles;
  const fuelPrice = Math.max(0, finite(input.fuelPrice));
  const mpg = Math.max(0.1, finite(input.mpg));
  const operatingCostPerMile = Math.max(0, finite(input.operatingCostPerMile));
  const target = Math.max(0.01, finite(input.targetAllMileRpm));

  const grossRpm = loadedMiles > 0 ? rate / loadedMiles : 0;
  const allMileRpm = totalMiles > 0 ? rate / totalMiles : 0;
  const fuelGallons = totalMiles > 0 ? totalMiles / mpg : 0;
  const fuelCost = fuelGallons * fuelPrice;
  const operatingCost = totalMiles * operatingCostPerMile;
  const estimatedProfit = rate - fuelCost - operatingCost;
  const profitPerMile = totalMiles > 0 ? estimatedProfit / totalMiles : 0;
  const marginPercent = rate > 0 ? (estimatedProfit / rate) * 100 : 0;
  const deadheadPercent = totalMiles > 0 ? (deadheadMiles / totalMiles) * 100 : 0;

  let rating: LoadDecisionRating = "marginal";
  if (allMileRpm >= target && estimatedProfit > 0 && marginPercent >= 25) rating = "good";
  if (allMileRpm < target * 0.85 || estimatedProfit <= 0 || marginPercent < 15) rating = "poor";

  const reasons: string[] = [];
  if (allMileRpm >= target) reasons.push(`All-mile RPM is at or above your $${target.toFixed(2)} target.`);
  else reasons.push(`All-mile RPM is below your $${target.toFixed(2)} target.`);
  if (deadheadPercent > 20) reasons.push(`Deadhead is ${deadheadPercent.toFixed(1)}% of total miles and is reducing the load's efficiency.`);
  else reasons.push(`Deadhead is ${deadheadPercent.toFixed(1)}% of total miles.`);
  if (marginPercent >= 25) reasons.push(`Estimated margin is ${marginPercent.toFixed(1)}% after fuel and the operating-cost assumption.`);
  else reasons.push(`Estimated margin is ${marginPercent.toFixed(1)}%; review your assumptions before accepting.`);

  return { totalMiles, grossRpm, allMileRpm, fuelGallons, fuelCost, operatingCost, estimatedProfit, profitPerMile, marginPercent, deadheadPercent, rating, reasons };
}
