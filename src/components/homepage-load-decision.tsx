"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { analyzeLoadDecision } from "@/lib/load-decision";
import { trackEvent } from "@/lib/analytics";
import styles from "@/app/home-redesign.module.css";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const number = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1,
});

export default function HomepageLoadDecision() {
  const [rate, setRate] = useState(2450);
  const [loadedMiles, setLoadedMiles] = useState(820);
  const [deadheadMiles, setDeadheadMiles] = useState(95);
  const [fuelPrice, setFuelPrice] = useState(3.88);
  const [mpg, setMpg] = useState(6.7);
  const tracked = useRef(false);

  const result = useMemo(
    () =>
      analyzeLoadDecision({
        rate,
        loadedMiles,
        deadheadMiles,
        fuelPrice,
        mpg,
        operatingCostPerMile: 0.18,
        targetAllMileRpm: 2.1,
      }),
    [rate, loadedMiles, deadheadMiles, fuelPrice, mpg],
  );

  function markUsed() {
    if (tracked.current) return;
    tracked.current = true;
    trackEvent("load_decision_used", {
      source: "homepage",
      rating: result.rating,
    });
  }

  const ratingLabel =
    result.rating === "good"
      ? "GOOD LOAD"
      : result.rating === "poor"
        ? "POOR LOAD"
        : "MARGINAL LOAD";

  const ratingIcon = result.rating === "good" ? "✓" : result.rating === "poor" ? "✕" : "⚠";
  const verdictClass = result.rating === "good" ? styles.verdictGood : result.rating === "poor" ? styles.verdictPoor : styles.verdictMarginal;

  return (
    <div className={styles.calculatorCard}>
      <div className={styles.calculatorGrid}>
        <div className={styles.calculatorInputs}>
          <div className={styles.calculatorTitleRow}>
            <span>LOAD PARAMETERS</span>
            <b>REAL MILEVOXA ENGINE</b>
          </div>

          <label>
            <span>Offered Load Rate ($)</span>
            <input
              type="number"
              min="0"
              step="50"
              value={rate}
              onFocus={markUsed}
              onChange={(event) => {
                markUsed();
                setRate(Number(event.target.value) || 0);
              }}
            />
          </label>

          <div className={styles.twoInputs}>
            <label>
              <span>Loaded Miles</span>
              <input
                type="number"
                min="0"
                step="10"
                value={loadedMiles}
                onFocus={markUsed}
                onChange={(event) => {
                  markUsed();
                  setLoadedMiles(Number(event.target.value) || 0);
                }}
              />
            </label>
            <label>
              <span>Deadhead Miles</span>
              <input
                type="number"
                min="0"
                step="5"
                value={deadheadMiles}
                onFocus={markUsed}
                onChange={(event) => {
                  markUsed();
                  setDeadheadMiles(Number(event.target.value) || 0);
                }}
              />
            </label>
          </div>

          <div className={styles.twoInputs}>
            <label>
              <span>Diesel Price ($/gal)</span>
              <input
                type="number"
                min="0"
                step="0.05"
                value={fuelPrice}
                onFocus={markUsed}
                onChange={(event) => {
                  markUsed();
                  setFuelPrice(Number(event.target.value) || 0);
                }}
              />
            </label>
            <label>
              <span>Truck Avg MPG</span>
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={mpg}
                onFocus={markUsed}
                onChange={(event) => {
                  markUsed();
                  setMpg(Number(event.target.value) || 0.1);
                }}
              />
            </label>
          </div>

          <p>
            Uses a $0.18/mi operating-cost assumption and a $2.10 target all-mile RPM for this public example.
          </p>
        </div>

        <div className={styles.calculatorResults}>
          <div className={styles.resultsHeading}>
            <span>ESTIMATED FINANCIAL RESULT</span>
            <b className={`${styles.verdict} ${verdictClass}`}>
              {ratingIcon} {ratingLabel}
            </b>
          </div>

          <div className={styles.metricGrid}>
            <Metric label="Gross RPM" value={currency.format(result.grossRpm)} note="Loaded miles" />
            <Metric label="All-Mile RPM" value={currency.format(result.allMileRpm)} note="Incl. deadhead" green />
            <Metric label="Estimated Fuel" value={currency.format(result.fuelCost)} note={`${number.format(result.fuelGallons)} gallons`} amber />
            <Metric label="Deadhead Ratio" value={`${result.deadheadPercent.toFixed(1)}%`} note={`Of ${number.format(result.totalMiles)} mi`} />
          </div>

          <div className={styles.profitBanner}>
            <div>
              <span>ESTIMATED OPERATING PROFIT</span>
              <strong className={result.estimatedProfit >= 0 ? styles.greenText : styles.redText}>
                {result.estimatedProfit >= 0 ? "+" : ""}{currency.format(result.estimatedProfit)}
              </strong>
              <small>After estimated fuel and the operating-cost assumption.</small>
            </div>
            <div>
              <span>PROFIT PER ALL MILE</span>
              <strong>{currency.format(result.profitPerMile)}</strong>
              <small>{result.marginPercent.toFixed(1)}% estimated margin</small>
            </div>
          </div>

          <div className={styles.reasonList}>
            {result.reasons.map((reason) => (
              <div key={reason}><span>●</span>{reason}</div>
            ))}
          </div>

          <div className={styles.calculatorFooter}>
            <p>*Load Decision results are estimates based on the information and operating assumptions provided.</p>
            <Link href="/signup">Check the load before saying yes →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, note, green = false, amber = false }: { label: string; value: string; note: string; green?: boolean; amber?: boolean }) {
  return (
    <div className={styles.metricCard}>
      <span>{label}</span>
      <strong className={green ? styles.greenText : amber ? styles.amberText : ""}>{value}</strong>
      <small>{note}</small>
    </div>
  );
}
