"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type ToolKey = "cpm" | "load" | "owner" | "lease" | "fuel" | "rpm";

const tools: { key: ToolKey; title: string; text: string }[] = [
  { key: "cpm", title: "Trucking Cost Per Mile", text: "Know what every operating mile really costs." },
  { key: "load", title: "Load Profit Calculator", text: "Estimate profit before you accept the load." },
  { key: "owner", title: "Owner-Operator Profit", text: "Turn weekly revenue and expenses into real take-home profit." },
  { key: "lease", title: "Lease Operator / Contractor", text: "Estimate weekly take-home for a driver leasing a truck." },
  { key: "fuel", title: "Fuel Cost Calculator", text: "Estimate fuel gallons, spend and fuel cost per mile." },
  { key: "rpm", title: "Rate Per Mile Calculator", text: "Compare loaded RPM and true RPM including deadhead." },
];

export default function FreeTools() {
  const [active, setActive] = useState<ToolKey>("load");

  return (
    <div className="fp-free-tools-shell">
      <aside className="fp-free-tools-menu">
        <span>FREE TRUCKING TOOLS</span>
        <h2>Run the numbers before the road.</h2>
        <p>No account required. Use these calculators as often as you want.</p>
        <div>
          {tools.map((tool) => (
            <button
              type="button"
              key={tool.key}
              className={active === tool.key ? "active" : ""}
              onClick={() => setActive(tool.key)}
            >
              <strong>{tool.title}</strong>
              <small>{tool.text}</small>
            </button>
          ))}
        </div>
      </aside>

      <section className="fp-free-tool-workspace">
        {active === "cpm" && <CostPerMile />}
        {active === "load" && <LoadProfit />}
        {active === "owner" && <OwnerProfit />}
        {active === "lease" && <LeaseOperatorProfit />}
        {active === "fuel" && <FuelCost />}
        {active === "rpm" && <RatePerMile />}

        <div className="fp-tool-cta">
          <div>
            <span>Want these numbers saved automatically?</span>
            <strong>MileVoxa connects loads, trucks and costs for you.</strong>
          </div>
          <Link href="/signup">Start 14-Day Free Trial →</Link>
        </div>
      </section>
    </div>
  );
}

function CostPerMile() {
  const [miles,setMiles]=useState(2500);
  const [fuel,setFuel]=useState(1500);
  const [maintenance,setMaintenance]=useState(350);
  const [fixed,setFixed]=useState(900);
  const [other,setOther]=useState(250);
  const total=fuel+maintenance+fixed+other;
  return <ToolFrame title="Trucking Cost Per Mile" text="Add your weekly operating costs and miles.">
    <Field label="Miles" value={miles} set={setMiles}/>
    <Field label="Fuel" value={fuel} set={setFuel} money/>
    <Field label="Maintenance" value={maintenance} set={setMaintenance} money/>
    <Field label="Fixed Costs" value={fixed} set={setFixed} money/>
    <Field label="Other Costs" value={other} set={setOther} money/>
    <Results rows={[
      ["Total Cost",usd(total)],
      ["Cost / Mile",usd(miles>0?total/miles:0)],
    ]}/>
  </ToolFrame>;
}

function LoadProfit() {
  const [rate,setRate]=useState(3500);
  const [loaded,setLoaded]=useState(1200);
  const [deadhead,setDeadhead]=useState(120);
  const [fuel,setFuel]=useState(700);
  const [tolls,setTolls]=useState(90);
  const [driver,setDriver]=useState(0);
  const [other,setOther]=useState(100);
  const miles=loaded+deadhead;
  const costs=fuel+tolls+driver+other;
  const profit=rate-costs;
  return <ToolFrame title="Load Profit Calculator" text="Estimate what a load leaves after direct operating costs.">
    <Field label="Load Rate" value={rate} set={setRate} money/>
    <Field label="Loaded Miles" value={loaded} set={setLoaded}/>
    <Field label="Deadhead Miles" value={deadhead} set={setDeadhead}/>
    <Field label="Fuel Cost" value={fuel} set={setFuel} money/>
    <Field label="Tolls" value={tolls} set={setTolls} money/>
    <Field label="Driver Pay" value={driver} set={setDriver} money/>
    <Field label="Other Load Costs" value={other} set={setOther} money/>
    <Results rows={[
      ["Estimated Profit",usd(profit)],
      ["Loaded RPM",usd(loaded>0?rate/loaded:0)],
      ["True RPM",usd(miles>0?rate/miles:0)],
      ["Profit / Mile",usd(miles>0?profit/miles:0)],
      ["Margin",`${rate>0?(profit/rate*100).toFixed(1):"0.0"}%`],
    ]}/>
  </ToolFrame>;
}

function OwnerProfit() {
  const [revenue,setRevenue]=useState(8000);
  const [fuel,setFuel]=useState(2200);
  const [variable,setVariable]=useState(800);
  const [fixed,setFixed]=useState(1200);
  const [fees,setFees]=useState(900);
  const cost=fuel+variable+fixed+fees;
  const profit=revenue-cost;
  return <ToolFrame title="Owner-Operator Profit Calculator" text="See what remains after the weekly costs that run the truck.">
    <Field label="Weekly Revenue" value={revenue} set={setRevenue} money/>
    <Field label="Fuel" value={fuel} set={setFuel} money/>
    <Field label="Other Variable Costs" value={variable} set={setVariable} money/>
    <Field label="Fixed Costs" value={fixed} set={setFixed} money/>
    <Field label="Company / Dispatch Fees" value={fees} set={setFees} money/>
    <Results rows={[
      ["Total Costs",usd(cost)],
      ["Weekly Net Profit",usd(profit)],
      ["Profit Margin",`${revenue>0?(profit/revenue*100).toFixed(1):"0.0"}%`],
      ["Monthly Run Rate",usd(profit*4.33)],
    ]}/>
  </ToolFrame>;
}


function LeaseOperatorProfit() {
  const [gross,setGross]=useState(8500);
  const [miles,setMiles]=useState(2800);
  const [lease,setLease]=useState(1250);
  const [fuel,setFuel]=useState(2300);
  const [insurance,setInsurance]=useState(350);
  const [companyPercent,setCompanyPercent]=useState(15);
  const [maintenanceRate,setMaintenanceRate]=useState(0.15);
  const [other,setOther]=useState(250);

  const companyFee=gross*(companyPercent/100);
  const maintenanceReserve=miles*maintenanceRate;
  const totalDeductions=
    lease+fuel+insurance+companyFee+maintenanceReserve+other;
  const takeHome=gross-totalDeductions;
  const profitPerMile=miles>0?takeHome/miles:0;
  const grossPerMile=miles>0?gross/miles:0;
  const deductionPercent=gross>0?(totalDeductions/gross)*100:0;

  return <ToolFrame
    title="Lease Operator / Contractor Driver Calculator"
    text="Estimate what a leased-truck driver keeps after the weekly deductions that come out of gross revenue."
  >
    <Field label="Weekly Gross Revenue" value={gross} set={setGross} money/>
    <Field label="Weekly Miles" value={miles} set={setMiles}/>
    <Field label="Truck Lease / Rent" value={lease} set={setLease} money/>
    <Field label="Fuel Cost" value={fuel} set={setFuel} money/>
    <Field label="Insurance / Weekly Fixed Charge" value={insurance} set={setInsurance} money/>
    <Field label="Company / Dispatch Fee %" value={companyPercent} set={setCompanyPercent} step=".1"/>
    <Field label="Maintenance Reserve / Mile" value={maintenanceRate} set={setMaintenanceRate} money step=".01"/>
    <Field label="Other Weekly Deductions" value={other} set={setOther} money/>

    <Results rows={[
      ["Estimated Take-Home",usd(takeHome)],
      ["Total Deductions",usd(totalDeductions)],
      ["Company Fee",usd(companyFee)],
      ["Maintenance Reserve",usd(maintenanceReserve)],
      ["Gross / Mile",usd(grossPerMile)],
      ["Take-Home / Mile",usd(profitPerMile)],
      ["Deductions",`${deductionPercent.toFixed(1)}%`],
    ]}/>

    <div className="fp-tool-lease-breakdown">
      <div>
        <span>Truck lease / rent</span>
        <strong>{usd(lease)}</strong>
      </div>
      <div>
        <span>Fuel</span>
        <strong>{usd(fuel)}</strong>
      </div>
      <div>
        <span>Insurance / fixed charge</span>
        <strong>{usd(insurance)}</strong>
      </div>
      <div>
        <span>Company / dispatch fee</span>
        <strong>{usd(companyFee)}</strong>
      </div>
      <div>
        <span>Maintenance reserve</span>
        <strong>{usd(maintenanceReserve)}</strong>
      </div>
      <div>
        <span>Other deductions</span>
        <strong>{usd(other)}</strong>
      </div>
    </div>

    <div className="fp-tool-helper-note">
      <strong>Built for leased-truck drivers and contractors</strong>
      <p>
        Use the numbers from your settlement statement. If your carrier deducts
        items separately—such as trailer rent, permits, ELD, occupational
        accident insurance, escrow, or advances—include them under Other Weekly
        Deductions.
      </p>
    </div>
  </ToolFrame>;
}

function FuelCost() {
  const [miles,setMiles]=useState(2500);
  const [mpg,setMpg]=useState(7);
  const [price,setPrice]=useState(3.65);
  const gallons=mpg>0?miles/mpg:0;
  const cost=gallons*price;
  return <ToolFrame title="Fuel Cost Calculator" text="Estimate gallons and fuel spend for a trip or week.">
    <Field label="Miles" value={miles} set={setMiles}/>
    <Field label="Truck MPG" value={mpg} set={setMpg} step=".1"/>
    <Field label="Fuel Price / Gallon" value={price} set={setPrice} money step=".01"/>
    <Results rows={[
      ["Estimated Gallons",`${gallons.toFixed(1)} gal`],
      ["Estimated Fuel Cost",usd(cost)],
      ["Fuel Cost / Mile",usd(miles>0?cost/miles:0)],
    ]}/>
  </ToolFrame>;
}

function RatePerMile() {
  const [rate,setRate]=useState(3500);
  const [loaded,setLoaded]=useState(1200);
  const [deadhead,setDeadhead]=useState(120);
  const total=loaded+deadhead;
  return <ToolFrame title="Rate Per Mile Calculator" text="Compare the advertised RPM with the true RPM after deadhead.">
    <Field label="Load Rate" value={rate} set={setRate} money/>
    <Field label="Loaded Miles" value={loaded} set={setLoaded}/>
    <Field label="Deadhead Miles" value={deadhead} set={setDeadhead}/>
    <Results rows={[
      ["Loaded RPM",usd(loaded>0?rate/loaded:0)],
      ["True RPM",usd(total>0?rate/total:0)],
      ["Total Miles",`${total.toLocaleString()} mi`],
      ["Deadhead",`${total>0?(deadhead/total*100).toFixed(1):"0.0"}%`],
    ]}/>
  </ToolFrame>;
}

function ToolFrame({title,text,children}:{title:string;text:string;children:React.ReactNode}) {
  return <div className="fp-tool-frame">
    <div className="fp-tool-frame-heading"><span>FREE CALCULATOR</span><h1>{title}</h1><p>{text}</p></div>
    <div className="fp-tool-form-grid">{children}</div>
  </div>;
}

function Field({label,value,set,money=false,step="1"}:{label:string;value:number;set:(v:number)=>void;money?:boolean;step?:string}) {
  return <label className="fp-tool-field"><span>{label}</span><div className="fp-tool-input">{money&&<b>$</b>}<input type="number" step={step} value={value} onChange={e=>set(Number(e.target.value)||0)}/></div></label>;
}

function Results({rows}:{rows:[string,string][]}) {
  return <div className="fp-tool-results">{rows.map(([label,value],index)=><div key={label} className={index===0?"primary":""}><span>{label}</span><strong>{value}</strong></div>)}</div>;
}

function usd(value:number) {
  return new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:2}).format(value||0);
}
