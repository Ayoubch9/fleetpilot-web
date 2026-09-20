"use client";

import { ChangeEvent, useRef, useState } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Expense = {
  category: string | null; expense_date: string | null; amount: number | string | null;
  vendor: string | null; description: string | null; truck_id: string | null;
  load_id: string | null; gallons: number | string | null;
  fuel_price_per_gallon: number | string | null;
};

export default function ExpenseQuickActions({ expenses }: { expenses: Expense[] }) {
  const router=useRouter(); const fileRef=useRef<HTMLInputElement>(null);
  const [open,setOpen]=useState(false); const [rows,setRows]=useState<Record<string,unknown>[]>([]);
  const [fileName,setFileName]=useState(""); const [error,setError]=useState(""); const [busy,setBusy]=useState(false);

  function add(){ window.dispatchEvent(new CustomEvent("fleetpilot:open-add-expense")); }
  async function choose(event:ChangeEvent<HTMLInputElement>){
    const file=event.target.files?.[0]; if(!file)return; setFileName(file.name); setError("");
    try{ const parsed=parseCsv(await file.text()); if(!parsed.length)throw new Error("No valid expense rows found."); setRows(parsed); setOpen(true);}
    catch(e){setRows([]);setError(e instanceof Error?e.message:"Could not read CSV.");setOpen(true)}
    finally{event.target.value=""}
  }
  async function importRows(){
    if(!rows.length)return; setBusy(true); setError("");
    const supabase=createClient(); const {error}=await supabase.from("expenses").insert(rows);
    setBusy(false); if(error){setError(error.message);return;} setOpen(false);setRows([]);router.refresh();
  }
  function exportCsv(){
    if(!expenses.length){setError("No expenses in the current view to export.");return;}
    const data=[["Date","Category","Amount","Vendor","Description","Truck ID","Load ID","Gallons","Price/Gallon"],
      ...expenses.map(e=>[e.expense_date||"",e.category||"",String(Number(e.amount||0)),e.vendor||"",e.description||"",e.truck_id||"",e.load_id||"",String(Number(e.gallons||0)||""),String(Number(e.fuel_price_per_gallon||0)||"")])];
    const csv=data.map(r=>r.map(v=>`"${String(v).replaceAll('"','""')}"`).join(",")).join("\r\n");
    const url=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8;"})); const a=document.createElement("a");
    a.href=url;a.download=`milevoxa-expenses-${new Date().toISOString().slice(0,10)}.csv`;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
  }
  return <>
    <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={choose}/>
    <div className="mt-3 grid gap-2">
      <Action label="Add Expense" type="add" primary onClick={add}/>
      <Action label="Import from File" type="import" onClick={()=>fileRef.current?.click()}/>
      <Action label="Export Expenses" type="export" onClick={exportCsv} disabled={!expenses.length}/>
      <Link href="/reimbursements" className="fp-expense-side-action"><span className="fp-expense-side-icon"><Icon type="reimburse"/></span><span>Reimbursements</span><span>›</span></Link>
    </div>
    {error&&!open&&<div className="fp-expense-quick-error">{error}</div>}
    {open&&typeof document!=="undefined"&&createPortal(<div className="fp-expense-import-backdrop">
      <div className="fp-expense-import-modal"><header><div><span>CSV IMPORT</span><h2>Import Expenses</h2><p>Review your expense file before importing.</p></div><button onClick={()=>setOpen(false)}>×</button></header>
      <div className="fp-expense-import-body"><div className="fp-expense-import-file"><strong>{fileName}</strong><span>{rows.length} valid rows</span></div>
      <div className="fp-expense-import-format"><strong>Required columns</strong><span>expense_date, category, amount. Optional: vendor, description, truck_id, load_id, gallons, fuel_price_per_gallon.</span></div>
      {error&&<div className="fp-expense-import-error">{error}</div>}</div>
      <footer><button onClick={()=>setOpen(false)} disabled={busy}>Cancel</button><button className="primary" onClick={importRows} disabled={busy||!rows.length}>{busy?"Importing...":`Import ${rows.length} Expenses`}</button></footer></div>
    </div>,document.body)}
  </>;
}
function Action({label,type,primary=false,onClick,disabled=false}:{label:string;type:"add"|"import"|"export";primary?:boolean;onClick:()=>void;disabled?:boolean}){
 return <button type="button" className={`fp-expense-side-action ${primary?"primary":""}`} onClick={onClick} disabled={disabled}><span className="fp-expense-side-icon"><Icon type={type}/></span><span>{label}</span><span>›</span></button>
}
function Icon({type}:{type:"add"|"import"|"export"|"reimburse"}){const c={viewBox:"0 0 24 24",className:"h-[13px] w-[13px] fill-none stroke-current",strokeWidth:1.8};
 if(type==="add")return <svg {...c}><path d="M12 5v14M5 12h14"/></svg>;
 if(type==="import")return <svg {...c}><path d="M12 3v12M8 7l4-4 4 4M5 19h14"/></svg>;
 if(type==="export")return <svg {...c}><path d="M12 3v12M8 11l4 4 4-4M5 19h14"/></svg>;
 return <svg {...c}><circle cx="12" cy="12" r="8"/><path d="M12 8v5l3 2"/></svg>
}
function parseCsv(text:string){
 const lines=text.replace(/^\uFEFF/,"").split(/\r?\n/).filter(Boolean); if(lines.length<2)return [];
 const headers=csvLine(lines[0]).map(h=>h.trim().toLowerCase().replace(/[^a-z0-9]+/g,"_").replace(/^_|_$/g,""));
 for(const r of ["expense_date","category","amount"]) if(!headers.includes(r))throw new Error(`CSV is missing ${r}.`);
 return lines.slice(1).map(csvLine).map(c=>Object.fromEntries(headers.map((h,i)=>[h,(c[i]||"").trim()]))).filter(r=>r.expense_date&&r.category&&Number(r.amount)>0).map(r=>({
  expense_date:r.expense_date,category:r.category,amount:Number(r.amount),vendor:r.vendor||null,description:r.description||null,truck_id:r.truck_id||null,load_id:r.load_id||null,
  gallons:r.gallons?Number(r.gallons):null,fuel_price_per_gallon:r.fuel_price_per_gallon?Number(r.fuel_price_per_gallon):null
 }));
}
function csvLine(line:string){const out:string[]=[];let s="";let q=false;for(let i=0;i<line.length;i++){const ch=line[i];if(ch==='"'){if(q&&line[i+1]==='"'){s+='"';i++;}else q=!q;}else if(ch===","&&!q){out.push(s);s="";}else s+=ch;}out.push(s);return out;}
