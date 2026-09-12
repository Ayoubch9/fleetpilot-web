import AppShell from "@/components/app-shell";
import { getFleetPilotAccount } from "@/lib/fleetpilot-account";
import ReportActions from "./report-actions";

type Load = { truck_id:string|null; rate:number|string|null; loaded_miles:number|string|null; deadhead_miles:number|string|null; status:string|null; pickup_date:string|null };
type Expense = { truck_id:string|null; amount:number|string|null; category:string|null; expense_date:string|null };
type Truck = { id:string; unit_number:string };

const n=(v:unknown)=>Number(v||0)||0;
const money=(v:number)=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(v);

export default async function ReportsPage() {
  const { supabase, fullName, companyName, role } = await getFleetPilotAccount();
  const [{data:loadsData},{data:expensesData},{data:trucksData}] = await Promise.all([
    supabase.from("loads").select("truck_id, rate, loaded_miles, deadhead_miles, status, pickup_date").order("pickup_date",{ascending:false}).limit(500),
    supabase.from("expenses").select("truck_id, amount, category, expense_date").order("expense_date",{ascending:false}).limit(1000),
    supabase.from("trucks").select("id, unit_number"),
  ]);
  const loads=(loadsData??[]) as Load[];
  const expenses=(expensesData??[]) as Expense[];
  const trucks=(trucksData??[]) as Truck[];
  const revenue=loads.reduce((s,r)=>s+n(r.rate),0);
  const expenseTotal=expenses.reduce((s,r)=>s+n(r.amount),0);
  const net=revenue-expenseTotal;
  const completed=loads.filter(r=>["COMPLETED","DELIVERED"].includes((r.status||"").toUpperCase())).length;

  const categories = ["Fuel","Maintenance","Tolls","Insurance","Other"].map((label,idx)=>{
    const amount=expenses.filter(e=>{
      const c=(e.category||"Other").toLowerCase();
      if(label==="Other") return !["fuel","maintenance","tolls","insurance"].some(x=>c.includes(x));
      return c.includes(label.toLowerCase());
    }).reduce((s,e)=>s+n(e.amount),0);
    return {label,amount,color:["#58bd69","#765ce7","#f2b33f","#e85f58","#9baac0"][idx]};
  });

  const truckRows=trucks.map(t=>{
    const r=loads.filter(l=>l.truck_id===t.id).reduce((s,l)=>s+n(l.rate),0);
    const e=expenses.filter(x=>x.truck_id===t.id).reduce((s,x)=>s+n(x.amount),0);
    const count=loads.filter(l=>l.truck_id===t.id).length;
    return {unit:t.unit_number,revenue:r,expenses:e,profit:r-e,loads:count};
  }).sort((a,b)=>b.profit-a.profit).slice(0,5);

  return <AppShell active="reports" fullName={fullName} companyName={companyName} role={role}>
    <div className="fp-tool-page">
      <div className="fp-tool-heading"><div><h1>Reports</h1><p>Get insights into your operations, costs, and profitability.</p></div><ReportActions truckRows={truckRows} /></div>
      <div className="fp-report-kpis">
        <Kpi label="Total Revenue" value={money(revenue)} tone="blue"/>
        <Kpi label="Total Expenses" value={money(expenseTotal)} tone="red"/>
        <Kpi label="Net Profit" value={money(net)} tone="green"/>
        <Kpi label="Loads Completed" value={String(completed)} tone="purple"/>
      </div>

      <div className="fp-report-layout">
        <div>
          <section className="fp-panel">
            <div className="fp-tabs-row"><span className="active">Overview</span><span>Financial</span><span>Loads</span><span>Fuel</span><span>Maintenance</span><span>Drivers</span></div>
            <div className="fp-report-filters"><button>📅 All Time⌄</button><button>All Trucks⌄</button><button>All Drivers⌄</button><button className="ml-auto">⇩ Export</button></div>
            <div className="fp-report-chart-grid">
              <div><h2>Revenue vs. Expenses</h2><ReportBars revenue={revenue} expenses={expenseTotal}/></div>
              <div><h2>Expense Breakdown</h2><ReportDonut total={expenseTotal} items={categories}/></div>
            </div>
          </section>

          <section className="fp-panel mt-3">
            <div className="fp-section-title"><h2>Top Performing Trucks</h2><span>View All →</span></div>
            <table className="fp-compact-table"><thead><tr><th>#</th><th>Truck</th><th>Revenue</th><th>Expenses</th><th>Net Profit</th><th>Loads</th></tr></thead>
            <tbody>{truckRows.map((r,i)=><tr key={r.unit}><td>{i+1}</td><td>#{r.unit}</td><td>{money(r.revenue)}</td><td>{money(r.expenses)}</td><td className="good">{money(r.profit)}</td><td>{r.loads}</td></tr>)}</tbody></table>
          </section>
        </div>
        <aside className="fp-right-stack">
          <section className="fp-panel side"><h2>Quick Actions</h2><div className="mt-2 text-[9px] leading-[1.45] text-[#6f8197]">Use the export controls above to print/save the current report as PDF or download the truck-performance CSV.</div><Action text="Schedule Report"/><Action text="Custom Report"/></section>
          <Promo text={"Turn Your Data\nInto Progress."}/>
        </aside>
      </div>
    </div>
  </AppShell>
}

function Kpi({label,value,tone}:{label:string;value:string;tone:string}){return <div className="fp-tool-kpi"><span className={`icon ${tone}`}>◫</span><div><small>{label}</small><strong>{value}</strong><em>↑ Live data</em></div></div>}
function Action({text}:{text:string}){return <button className="fp-side-action">▣ <span>{text}</span><b>›</b></button>}
function Promo({text}:{text:string}){return <div className="fp-tool-promo"><div>{text.split("\n").map((x,i)=><div key={i}>{x}</div>)}</div><small>FleetPilot</small></div>}
function ReportBars({revenue,expenses}:{revenue:number;expenses:number}){const max=Math.max(revenue,expenses,1);return <div className="fp-report-bars">{[.45,.6,.52,.7,.58,.82,.67,.74,.62,.9].map((f,i)=><div className="grp" key={i}><i style={{height:`${Math.max(10,f*110)}px`}}/><b style={{height:`${Math.max(7,f*(expenses/max)*110)}px`}}/></div>)}</div>}
function ReportDonut({total,items}:{total:number;items:{label:string;amount:number;color:string}[]}){let c=0;const safe=Math.max(total,1);const stops=items.map(x=>{const a=c,b=c+x.amount/safe*100;c=b;return `${x.color} ${a}% ${b}%`});return <div className="fp-report-donut-wrap"><div className="fp-report-donut" style={{background:`conic-gradient(${stops.join(",")})`}}><div><strong>{money(total)}</strong><span>Total Expenses</span></div></div><div>{items.map(x=><p key={x.label}><i style={{background:x.color}}/>{x.label}<b>{Math.round(x.amount/safe*100)}%</b></p>)}</div></div>}
