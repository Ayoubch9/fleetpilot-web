"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { analyzeLoadDecision } from "@/lib/load-decision";
import { normalizeUsLocation } from "@/lib/load-domain";

type Truck = { id: string; unit_number: string; make: string | null; model: string | null; status?: string | null };

export default function LoadDecisionCenter({ trucks, historicalFuelPrice }: { trucks: Truck[]; historicalFuelPrice: number | null }) {
  const router = useRouter();
  const [truckId, setTruckId] = useState(trucks[0]?.id || "");
  const [rate, setRate] = useState("");
  const [loadedMiles, setLoadedMiles] = useState("");
  const [deadheadMiles, setDeadheadMiles] = useState("0");
  const [fuelPrice, setFuelPrice] = useState((historicalFuelPrice ?? 3.65).toFixed(2));
  const [mpg, setMpg] = useState("6.5");
  const [operatingCost, setOperatingCost] = useState("0.45");
  const [targetRpm, setTargetRpm] = useState("2.00");
  const [showAccept, setShowAccept] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const result = useMemo(() => analyzeLoadDecision({
    rate: Number(rate), loadedMiles: Number(loadedMiles), deadheadMiles: Number(deadheadMiles), fuelPrice: Number(fuelPrice), mpg: Number(mpg), operatingCostPerMile: Number(operatingCost), targetAllMileRpm: Number(targetRpm),
  }), [rate, loadedMiles, deadheadMiles, fuelPrice, mpg, operatingCost, targetRpm]);

  const ready = Number(rate) > 0 && Number(loadedMiles) > 0 && result.totalMiles > 0;
  const ratingLabel = result.rating === "good" ? "Good Load" : result.rating === "poor" ? "Poor Load" : "Marginal Load";

  async function saveLoad(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage(""); setSaving(true);
    const form = new FormData(event.currentTarget);
    const pickup = normalizeUsLocation(String(form.get("pickup") || ""));
    const delivery = normalizeUsLocation(String(form.get("delivery") || ""));
    if (!truckId || !form.get("load_number") || !form.get("pickup_date") || !form.get("delivery_date")) { setMessage("Complete the required load details."); setSaving(false); return; }
    if (!pickup.ok) { setMessage(`Pickup: ${pickup.error}`); setSaving(false); return; }
    if (!delivery.ok) { setMessage(`Delivery: ${delivery.error}`); setSaving(false); return; }
    const supabase = createClient();
    const { error } = await supabase.from("loads").insert({ truck_id: truckId, load_number: String(form.get("load_number")).trim(), broker: String(form.get("broker") || "").trim(), pickup: pickup.value, delivery: delivery.value, pickup_date: String(form.get("pickup_date")), delivery_date: String(form.get("delivery_date")), rate: Number(rate), loaded_miles: Number(loadedMiles), deadhead_miles: Number(deadheadMiles), status: "UPCOMING" });
    if (error) { setMessage(error.message); setSaving(false); return; }
    setSaving(false); setMessage("Load added successfully. Opening Loads…"); router.push("/loads"); router.refresh();
  }

  return <div className="fp-load-decision-page">
    <div className="fp-load-decision-hero"><div><span>LOAD DECISION CENTER</span><h1>Know the load before you take it.</h1><p>Estimate the real economics of a broker offer using all miles, fuel, and your operating-cost assumptions.</p></div><div className="fp-load-decision-beta">Decision support · Beta</div></div>

    <div className="fp-load-decision-grid">
      <section className="fp-load-decision-card"><h2>Load offer</h2><p className="fp-load-decision-muted">Start with the numbers the broker gave you.</p>
        <div className="fp-load-decision-fields">
          <label>Truck<select value={truckId} onChange={e=>setTruckId(e.target.value)}><option value="">Select truck</option>{trucks.map(t=><option key={t.id} value={t.id}>Truck {t.unit_number}{t.make ? ` · ${t.make}` : ""}</option>)}</select></label>
          <Field label="Rate ($)" value={rate} set={setRate}/><Field label="Loaded miles" value={loadedMiles} set={setLoadedMiles}/><Field label="Deadhead miles" value={deadheadMiles} set={setDeadheadMiles}/>
        </div>
        <div className="fp-load-decision-assumptions"><h3>Cost assumptions</h3><p>{historicalFuelPrice ? "Fuel price is prefilled from your recent recorded fuel purchases." : "No usable recent fuel purchase history was found, so MileVoxa started with an editable fuel-price assumption."}</p><div className="fp-load-decision-fields"><Field label="Fuel price / gal ($)" value={fuelPrice} set={setFuelPrice}/><Field label="Truck MPG" value={mpg} set={setMpg}/><Field label="Other operating cost / mile ($)" value={operatingCost} set={setOperatingCost}/><Field label="Target all-mile RPM ($)" value={targetRpm} set={setTargetRpm}/></div></div>
      </section>

      <section className="fp-load-decision-card fp-load-decision-result"><div className={`fp-load-decision-rating ${ready ? result.rating : "empty"}`}><span>{ready ? ratingLabel : "Enter a load offer"}</span><strong>{ready ? `$${result.estimatedProfit.toLocaleString(undefined,{maximumFractionDigits:0})}` : "—"}</strong><small>{ready ? "estimated contribution after fuel + operating-cost assumption" : "Results update as you type"}</small></div>
        <div className="fp-load-decision-metrics"><Metric label="All-mile RPM" value={ready ? money(result.allMileRpm) : "—"}/><Metric label="Gross RPM" value={ready ? money(result.grossRpm) : "—"}/><Metric label="Total miles" value={ready ? result.totalMiles.toLocaleString() : "—"}/><Metric label="Fuel gallons" value={ready ? result.fuelGallons.toFixed(1) : "—"}/><Metric label="Fuel cost" value={ready ? money(result.fuelCost) : "—"}/><Metric label="Profit / mile" value={ready ? money(result.profitPerMile) : "—"}/><Metric label="Est. margin" value={ready ? `${result.marginPercent.toFixed(1)}%` : "—"}/><Metric label="Deadhead share" value={ready ? `${result.deadheadPercent.toFixed(1)}%` : "—"}/></div>
        {ready && <div className="fp-load-decision-why"><h3>Why MileVoxa rated this {ratingLabel.toLowerCase()}</h3>{result.reasons.map(r=><p key={r}>• {r}</p>)}</div>}
        <div className="fp-load-decision-disclaimer">Estimates are decision-support only. Actual profit can change with fuel, tolls, detention, maintenance, taxes, fees, and other costs.</div>
        <button className="fp-load-decision-primary" disabled={!ready || !truckId} onClick={()=>setShowAccept(v=>!v)}>{showAccept ? "Close load details" : "Accept & Add Load"}</button>
      </section>
    </div>

    {showAccept && ready && <form className="fp-load-decision-accept" onSubmit={saveLoad}><div><span>ACCEPTED OFFER</span><h2>Finish the dispatch details</h2><p>The rate and mileage you already analyzed will be reused automatically.</p></div><div className="fp-load-decision-accept-grid"><label>Load ID *<input name="load_number" required/></label><label>Broker / Customer<input name="broker"/></label><label>Pickup City, State *<input name="pickup" placeholder="Dallas, TX" required/></label><label>Delivery City, State *<input name="delivery" placeholder="Atlanta, GA" required/></label><label>Pickup Date *<input name="pickup_date" type="date" required/></label><label>Delivery Date *<input name="delivery_date" type="date" required/></label></div>{message && <p className="fp-load-decision-message">{message}</p>}<button className="fp-load-decision-primary" disabled={saving}>{saving ? "Adding load…" : "Add to Loads"}</button></form>}
  </div>;
}

function Field({label,value,set}:{label:string;value:string;set:(v:string)=>void}) { return <label>{label}<input inputMode="decimal" type="number" min="0" step="0.01" value={value} onChange={e=>set(e.target.value)}/></label>; }
function Metric({label,value}:{label:string;value:string}) { return <div><span>{label}</span><strong>{value}</strong></div>; }
function money(value:number){ return `$${value.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`; }
