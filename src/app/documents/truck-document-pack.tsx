"use client";
import { useMemo,useState } from "react";
import { TRUCK_PACK_TYPES,documentStatus } from "@/lib/document-domain";
type Doc={id:string;name:string;document_type:string|null;truck_id:string|null;expiration_date:string|null;carry_in_truck:boolean;jurisdiction:string|null};
type Truck={id:string;unit_number:string};
export default function TruckDocumentPack({docs,trucks}:{docs:Doc[];trucks:Truck[]}){
  const [truckId,setTruckId]=useState(trucks[0]?.id||"");
  const truckDocs=useMemo(()=>docs.filter(d=>d.truck_id===truckId),[docs,truckId]);
  const carry=truckDocs.filter(d=>d.carry_in_truck);
  const coverage=TRUCK_PACK_TYPES.map(type=>({type,present:truckDocs.some(d=>d.document_type===type&&documentStatus(d.expiration_date)!=="Expired")}));
  const ready=coverage.filter(x=>x.present).length;
  return <section className="fp-panel fp-truck-doc-pack">
    <div className="fp-doc-pack-heading"><div><span>DRIVER DOCUMENT WALLET</span><h2>Truck Document Pack</h2><p>Keep road-ready documents grouped by truck, jurisdiction and expiration.</p></div><select value={truckId} onChange={e=>setTruckId(e.target.value)}>{trucks.map(t=><option key={t.id} value={t.id}>Truck #{t.unit_number}</option>)}</select></div>
    {trucks.length===0?<div className="fp-doc-pack-empty">Add a truck before building a Truck Document Pack.</div>:<>
      <div className="fp-doc-pack-score"><div><strong>{ready}/{coverage.length}</strong><span>Core document types on file</span></div><div className="fp-doc-pack-progress"><i style={{width:`${coverage.length?(ready/coverage.length)*100:0}%`}}/></div><small>Organization checklist only; route/jurisdiction requirements can differ.</small></div>
      <div className="fp-doc-pack-types">{coverage.map(x=><div key={x.type} className={x.present?"ready":"missing"}><span>{x.present?"✓":"○"}</span><b>{x.type}</b></div>)}</div>
      <div className="fp-doc-wallet-list"><div className="fp-doc-wallet-title"><b>Marked for Driver Access</b><span>{carry.length} documents</span></div>{carry.slice(0,8).map(d=><div key={d.id}><span className={`status ${documentStatus(d.expiration_date).toLowerCase().replaceAll(" ","-")}`}/><div><b>{d.name}</b><small>{d.document_type||"Other"}{d.jurisdiction?` · ${d.jurisdiction}`:""}</small></div><em>{documentStatus(d.expiration_date)}</em></div>)}{carry.length===0&&<div className="empty">No documents marked “Keep in Truck Pack” yet.</div>}</div>
    </>}
  </section>
}
