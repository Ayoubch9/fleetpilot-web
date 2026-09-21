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
 const [{data:loads},{data:expenses},{data:trucks},{data:maintenance}] = await Promise.all([
  supabase.from("loads").select("rate, loaded_miles, deadhead_miles, truck_id").limit(500),
  supabase.from("expenses").select("amount, category, truck_id").limit(1000),
  supabase.from("trucks").select("id,unit_number,status"),
  supabase.from("maintenance_records").select("id,next_service_date").limit(300),
 ]);
 const revenue=(loads??[]).reduce((s:any,r:any)=>s+n(r.rate),0);
 const costs=(expenses??[]).reduce((s:any,r:any)=>s+n(r.amount),0);
 const profit=revenue-costs;
 const fuel=(expenses??[]).filter((e:any)=>(e.category||"").toLowerCase().includes("fuel")).reduce((s:any,e:any)=>s+n(e.amount),0);
 const active=(trucks??[]).filter((t:any)=>(t.status||"ACTIVE").toUpperCase()!=="INACTIVE").length;
 const service=(maintenance??[]).filter((m:any)=>m.next_service_date).length;
 const totalMiles=(loads??[]).reduce((s:any,r:any)=>s+n(r.loaded_miles)+n(r.deadhead_miles),0);
 return <AppShell active="pilot" fullName={fullName} companyName={companyName} role={role}>
  <div className="fp-tool-page">
   <div className="fp-tool-heading"><div><h1>Pilot AI</h1><p>Your AI assistant for smarter decisions, lower costs and higher profits.</p></div></div>
   <div className="fp-ai-layout">
    <section className="fp-panel fp-ai-chat">
      <h2>Ask Pilot</h2>
      <PilotChat
        initialQuestion={params.q || ""}
        suggested={[
          "What was my most profitable week?",
          "How can I reduce my fuel costs?",
          "What is my current profit margin?",
          "What maintenance is due soon?",
        ]}
      />
    </section>
    <aside className="fp-right-stack">
      <section className="fp-panel side"><h2>Suggested Questions</h2>{["What was my most profitable week?","How can I reduce my fuel costs?","Which truck is the most profitable?","Show me this month's expense summary","What maintenance is due soon?","Analyze fleet performance","Which routes are most profitable?","Compare fuel efficiency by truck"].map(x=><a key={x} href={`/pilot-ai?q=${encodeURIComponent(x)}`} className="fp-ai-suggest">✦ {x}</a>)}</section>
      <section className="fp-panel side"><h2>Quick Insights</h2><Insight text={`Fuel expenses: ${money(fuel)}`}/><Insight text={`${active} active truck${active===1?"":"s"}`}/><Insight text={`${service} service date${service===1?"":"s"} tracked`}/><Insight text={`Net profit: ${money(profit)}`}/></section>
    </aside>
   </div>
  </div>
 </AppShell>
}
function Insight({text}:{text:string}){return <div className="fp-ai-insight"><span>◉</span><p>{text}</p></div>}
