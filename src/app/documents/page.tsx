import { CHART_PALETTE,chartCategoryColor } from "@/lib/chart-palette";
import KpiTile from "@/components/kpi-tile";
import AppShell from "@/components/app-shell";
import { getMileVoxaAccount } from "@/lib/fleetpilot-account";
import { documentStatus } from "@/lib/document-domain";
import DocumentManager from "./document-manager";
import DocumentCenter from "./document-center";
import DocumentQuickActions from "./document-quick-actions";
import TruckDocumentPack from "./truck-document-pack";

type Doc={id:string;name:string;document_type:string|null;truck_id:string|null;expiration_date:string|null;storage_path:string;file_name:string;created_at:string|null;folder_id:string|null;jurisdiction:string|null;issue_date:string|null;effective_date:string|null;document_number:string|null;carry_in_truck:boolean;notes:string|null};
type Truck={id:string;unit_number:string}; type Folder={id:string;name:string};

export default async function DocumentsPage({
 searchParams,
}:{
 searchParams?:Promise<Record<string,string|string[]|undefined>>;
}){
 const params=searchParams ? await searchParams : {};
 const initialSearch=typeof params.q==="string" ? params.q : "";
 const initialFocus=typeof params.focus==="string" ? params.focus : "";
 const {supabase,fullName,companyName,role}=await getMileVoxaAccount();
 const {data:{user}}=await supabase.auth.getUser();
 const {data:membership}=await supabase.from("company_members").select("company_id").eq("user_id",user?.id).maybeSingle();
 const companyId=membership?.company_id||"";
 const [{data:truckData},folderResult,documentResult]=await Promise.all([
  supabase.from("trucks").select("id, unit_number").order("unit_number"),
  supabase.from("document_folders").select("id, name").order("name"),
  supabase.from("documents").select("id, name, document_type, truck_id, expiration_date, storage_path, file_name, created_at, folder_id, jurisdiction, issue_date, effective_date, document_number, carry_in_truck, notes").order("created_at",{ascending:false})
 ]);
 const trucks=(truckData??[]) as Truck[]; const folders=(folderResult.data??[]) as Folder[]; const docs=(documentResult.data??[]) as Doc[];
 const setupMissing=Boolean((documentResult.error&&/relation .*documents.* does not exist|could not find the table|schema cache|column .* does not exist/i.test(documentResult.error.message))||(folderResult.error&&/relation .*document_folders.* does not exist|could not find the table|schema cache/i.test(folderResult.error.message)));
 const expiring=docs.filter(d=>documentStatus(d.expiration_date)==="Expiring Soon"); const expired=docs.filter(d=>documentStatus(d.expiration_date)==="Expired"); const packDocs=docs.filter(d=>d.carry_in_truck);
 const typeCounts=new Map<string,number>(); for(const d of docs){const k=d.document_type||"Other";typeCounts.set(k,(typeCounts.get(k)||0)+1)}
 return <AppShell active="documents" fullName={fullName} companyName={companyName} role={role}><div className="fp-tool-page fp-documents-v2">
  <div className="fp-tool-heading"><div><h1>Documents</h1><p>Your fleet document vault for registrations, inspections, insurance, agreements, permits and driver-ready truck documents.</p></div>{companyId&&!setupMissing?<DocumentManager companyId={companyId} trucks={trucks} folders={folders}/>:<button className="fp-primary-btn" disabled>＋ Upload Document</button>}</div>
  {setupMissing&&<div className="fp-doc-setup-notice">Run <b>supabase_documents_command_center_v4_3_68.sql</b> once in Supabase SQL Editor to enable the upgraded Documents Command Center.</div>}
  <div className="mv-kpi-grid mt-4 fp-doc-kpis"><KpiTile label="Total Documents" value={docs.length} note="Stored in MileVoxa"/><KpiTile label="Truck Pack" value={packDocs.length} note="Marked for driver access"/><KpiTile label="Expiring Soon" value={expiring.length} note="Next 30 days"/><KpiTile label="Expired" value={expired.length} note="Needs attention"/></div>
  <TruckDocumentPack docs={docs} trucks={trucks}/>
  <div className="fp-doc-layout"><DocumentCenter docs={docs} trucks={trucks} folders={folders} setupMissing={setupMissing} initialSearch={initialSearch} initialFocus={initialFocus}/><aside className="fp-right-stack">
    {companyId&&!setupMissing?<DocumentQuickActions companyId={companyId}/>:<section className="fp-panel side"><h2>Quick Actions</h2><p className="fp-muted-center">Complete Documents setup to enable actions.</p></section>}
    <section className="fp-panel side"><h2>Documents by Type</h2><DocumentTypeDonut total={docs.length} items={[...typeCounts.entries()].slice(0,7)}/><div className="fp-doc-type-list">{[...typeCounts.entries()].slice(0,7).map(([name,count],index,entries)=>{const color=entries.length===1?CHART_PALETTE.green:chartCategoryColor(index);return <p key={name}><span className="fp-doc-type-label"><i style={{backgroundColor:color}}/>{name}</span><b>{count}</b></p>})}{docs.length===0&&<p className="fp-muted-center">No document types yet.</p>}</div></section>
    <div className="fp-tool-promo"><div>Stay Compliant.<br/>Keep Moving.</div><small>MileVoxa</small></div>
  </aside></div>
 </div></AppShell>
}
function DocumentTypeDonut({total,items}:{total:number;items:Array<[string,number]>}){if(total<=0||!items.length)return <div className="fp-document-type-donut empty"><div><strong>0</strong><span>Total Documents</span></div></div>;let cursor=0;const stops=items.map(([,count],index)=>{const share=(count/total)*100,start=cursor,end=cursor+share;cursor=end;const color=items.length===1?CHART_PALETTE.green:chartCategoryColor(index);return `${color} ${start}% ${end}%`});return <div className="fp-document-type-donut" style={{background:`conic-gradient(${stops.join(", ")})`}}><div><strong>{total}</strong><span>Total Documents</span></div></div>}
