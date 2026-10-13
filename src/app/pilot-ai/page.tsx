import { formatMoney } from "@/lib/format";
import AppShell from "@/components/app-shell";
import { getMileVoxaAccount } from "@/lib/fleetpilot-account";
import PilotChat from "./pilot-chat";

const n=(v:unknown)=>Number(v||0)||0;
const money=(v:number)=>formatMoney(v);

type SearchParams = Promise<{ q?: string }>;

export default async function PilotAIPage({
 searchParams,
}: {
 searchParams: SearchParams;
}){
 const params = await searchParams;
 const {supabase,fullName,companyName,role}=await getMileVoxaAccount();
 const [,{data:expenses},{data:trucks},{data:maintenance}] = await Promise.all([
  supabase.from("loads").select("rate, loaded_miles, deadhead_miles, truck_id").limit(500),
  supabase.from("expenses").select("amount, category, truck_id, gallons").limit(1000),
  supabase.from("trucks").select("id,unit_number,status"),
  supabase.from("maintenance_records").select("id,next_service_date").limit(300),
 ]);
 const fuelRows=(expenses??[]).filter((e)=>(e.category||"").toLowerCase().includes("fuel"));
 const fuel=fuelRows.reduce((s,e)=>s+n(e.amount),0);
 const gallons=fuelRows.reduce((s,e)=>s+n(e.gallons),0);
 const active=(trucks??[]).filter((t)=>(t.status||"ACTIVE").toUpperCase()!=="INACTIVE").length;
 const service=(maintenance??[]).filter((m)=>m.next_service_date).length;

 return <AppShell active="pilot" fullName={fullName} companyName={companyName} role={role}>
  <div className="fp-tool-page fp-pilot-page mv-pilot-ai-control-center">
   <div className="fp-tool-heading">
    <div>
     <span className="fp-pilot-overline">Intelligent Fleet Copilot</span>
     <h1>Pilot AI</h1>
     <p>Your AI assistant for smarter decisions, lower costs and higher profits.</p>
    </div>
    <div className="fp-pilot-hero-badge" aria-label="Data-driven decisions, connected to company data">
     <span className="fp-pilot-hero-mark" aria-hidden="true">🤖</span>
     <span><strong>Data-Driven Decisions</strong><small>Connected to your data</small></span>
    </div>
   </div>
   <div className="fp-ai-layout">
    <section className="fp-panel fp-ai-chat">
      <div className="fp-ai-panel-heading">
       <span className="fp-ai-panel-mark" aria-hidden="true">AI</span>
       <div><h2>Ask Pilot</h2><p>Ask about your loads, mileage, expenses, and settlements.</p></div>
       <span className="fp-ai-connected">Connected</span>
      </div>
      <PilotChat
        initialQuestion={params.q || ""}
        suggested={[
          "How many gallons of fuel did I use last week?",
          "What was my most profitable week?",
          "Break down last week's expenses by category.",
          "Compare fuel use by truck last week.",
        ]}
      />
    </section>
    <aside className="fp-right-stack">
      <section className="fp-panel side">
       <div className="fp-ai-side-heading"><h2>Suggested Questions</h2><span>Recommendations</span></div>
       {["How many gallons of fuel did I use last week?","Break down last week's fuel spend by truck","What was my most profitable week?","Show me this month's expense summary","What maintenance is due soon?","Analyze fleet performance","Which routes are most profitable?","Compare fuel efficiency by truck"].map(x=><a key={x} href={`/pilot-ai?q=${encodeURIComponent(x)}`} className="fp-ai-suggest"><span className="fp-ai-suggest-spark" aria-hidden="true">✦</span>{x}</a>)}
      </section>
      <section className="fp-panel side">
       <div className="fp-ai-side-heading"><h2>Quick Insights</h2><span>Live Telemetry</span></div>
       <Insight label="Fuel expenses" value={money(fuel)}/><Insight label="Fuel recorded:" value={`${gallons.toLocaleString()} gal`}/><Insight label="Active trucks" value={String(active)}/><Insight label="Service dates" value={`${service} tracked`}/>
      </section>
    </aside>
   </div>
  </div>
 </AppShell>
}
function Insight({label,value}:{label:string;value:string}){return <div className="fp-ai-insight"><span aria-hidden="true">•</span><p>{label}</p><strong>{value}</strong></div>}
