"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Truck={id:string;unit_number:string}; type Load={id:string;load_number:string|null};
type Expense={id:string;category:string|null;expense_date:string|null;amount:number|string|null;vendor:string|null;description:string|null;truck_id:string|null;load_id:string|null;gallons:number|string|null;fuel_price_per_gallon:number|string|null;receipt_path:string|null};
const categories=["Fuel","Maintenance","Tolls","Parking","Scale","Insurance","Permits","Driver Pay","Truck Payment","Trailer","Food / Travel","Other"];

export default function ExpenseActions({expense,trucks,loads}:{expense:Expense;trucks:Truck[];loads:Load[]}){
 const router=useRouter(); const triggerRef=useRef<HTMLButtonElement>(null); const [menu,setMenu]=useState(false); const [edit,setEdit]=useState(false); const [del,setDel]=useState(false); const [busy,setBusy]=useState(false); const [error,setError]=useState(""); const [pos,setPos]=useState({top:0,left:0});
 useEffect(()=>{if(!menu)return;function place(){const r=triggerRef.current?.getBoundingClientRect();if(!r)return;setPos({top:r.bottom+6,left:Math.min(window.innerWidth-180,Math.max(12,r.right-168))});}function outside(e:MouseEvent){const n=e.target as Node;if(triggerRef.current?.contains(n)||document.querySelector("[data-expense-actions-portal]")?.contains(n))return;setMenu(false)}place();window.addEventListener("scroll",place,true);window.addEventListener("resize",place);document.addEventListener("mousedown",outside);return()=>{window.removeEventListener("scroll",place,true);window.removeEventListener("resize",place);document.removeEventListener("mousedown",outside)}},[menu]);
 async function save(e:React.FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);setError("");const d=new FormData(e.currentTarget);const category=String(d.get("category"));const {error}=await createClient().from("expenses").update({
  category,expense_date:String(d.get("expense_date")),amount:Number(d.get("amount"))||0,vendor:String(d.get("vendor")||"").trim(),description:String(d.get("description")||"").trim(),
  truck_id:String(d.get("truck_id")||"")||null,load_id:String(d.get("load_id")||"")||null,gallons:category==="Fuel"?Number(d.get("gallons"))||null:null,
  fuel_price_per_gallon:category==="Fuel"?Number(d.get("fuel_price_per_gallon"))||null:null
 }).eq("id",expense.id);setBusy(false);if(error){setError(error.message);return;}setEdit(false);router.refresh();}
 async function remove(){setBusy(true);setError("");const s=createClient();if(expense.receipt_path)await s.storage.from("expense-receipts").remove([expense.receipt_path]);const {error}=await s.from("expenses").delete().eq("id",expense.id);setBusy(false);if(error){setError(error.message);return;}setDel(false);router.refresh();}
 return <><button ref={triggerRef} className="fp-expense-actions-trigger" onClick={()=>setMenu(v=>!v)} aria-label="Expense actions">•••</button>
 {menu&&typeof document!=="undefined"&&createPortal(<div data-expense-actions-portal className="fp-expense-actions-menu-portal" style={{top:pos.top,left:pos.left}}>
  <button onClick={()=>{setMenu(false);setEdit(true)}}><EditIcon/><span>Edit Expense</span></button>
  <button className="danger" onClick={()=>{setMenu(false);setDel(true)}}><DeleteIcon/><span>Delete Expense</span></button>
 </div>,document.body)}
 {edit&&typeof document!=="undefined"&&createPortal(<div className="fp-expense-action-backdrop"><form className="fp-expense-edit-modal" onSubmit={save}><header><div><span>EXPENSE DETAILS</span><h2>Edit Expense</h2><p>Update this operating expense.</p></div><button type="button" onClick={()=>setEdit(false)}>×</button></header>
 <div className="fp-expense-edit-grid">
  <label><span>Category</span><select name="category" defaultValue={expense.category||"Other"}>{categories.map(c=><option key={c}>{c}</option>)}</select></label>
  <label><span>Date</span><input name="expense_date" type="date" defaultValue={(expense.expense_date||"").slice(0,10)}/></label>
  <label><span>Amount</span><input name="amount" type="number" step="0.01" defaultValue={String(expense.amount||0)}/></label>
  <label><span>Vendor</span><input name="vendor" defaultValue={expense.vendor||""}/></label>
  <label><span>Truck</span><select name="truck_id" defaultValue={expense.truck_id||""}><option value="">No truck</option>{trucks.map(t=><option key={t.id} value={t.id}>Truck #{t.unit_number}</option>)}</select></label>
  <label><span>Load</span><select name="load_id" defaultValue={expense.load_id||""}><option value="">No load</option>{loads.map(l=><option key={l.id} value={l.id}>#{l.load_number||"Load"}</option>)}</select></label>
  <label><span>Gallons</span><input name="gallons" type="number" step="0.001" defaultValue={String(expense.gallons||"")}/></label>
  <label><span>Price / Gallon</span><input name="fuel_price_per_gallon" type="number" step="0.001" defaultValue={String(expense.fuel_price_per_gallon||"")}/></label>
  <label className="wide"><span>Description / Notes</span><textarea name="description" defaultValue={expense.description||""}/></label>
 </div>{error&&<div className="fp-expense-action-error">{error}</div>}<footer><button type="button" onClick={()=>setEdit(false)}>Cancel</button><button className="primary" disabled={busy}>{busy?"Saving...":"Save Changes"}</button></footer></form></div>,document.body)}
 {del&&typeof document!=="undefined"&&createPortal(<div className="fp-expense-action-backdrop"><div className="fp-expense-delete-modal"><div className="fp-expense-delete-icon"><DeleteIcon/></div><h2>Delete this expense?</h2><p>This permanently removes the expense and its receipt file if one is attached.</p>{error&&<div className="fp-expense-action-error">{error}</div>}<div><button onClick={()=>setDel(false)}>Cancel</button><button className="danger" onClick={remove} disabled={busy}>{busy?"Deleting...":"Delete Expense"}</button></div></div></div>,document.body)}</>;
}
function EditIcon(){return <svg viewBox="0 0 24 24"><path d="m4 20 4.2-1 10-10-3.2-3.2-10 10L4 20Z"/><path d="m13.8 7 3.2 3.2"/></svg>}
function DeleteIcon(){return <svg viewBox="0 0 24 24"><path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13"/><path d="M10 11v5M14 11v5"/></svg>}
