"use client";
import { FormEvent,useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function DocumentQuickActions({companyId}:{companyId:string}){
  const router=useRouter(); const [folderOpen,setFolderOpen]=useState(false); const [name,setName]=useState(""); const [saving,setSaving]=useState(false); const [error,setError]=useState("");
  const dispatch=(n:string)=>window.dispatchEvent(new Event(n));
  async function createFolder(e:FormEvent){e.preventDefault();if(!name.trim())return;setSaving(true);setError("");const s=createClient();const {error}=await s.from("document_folders").insert({company_id:companyId,name:name.trim()});if(error){setError(/duplicate/i.test(error.message)?"Folder already exists.":error.message);setSaving(false);return;}setName("");setFolderOpen(false);setSaving(false);router.refresh();}
  return <section className="fp-panel side fp-doc-quick-actions">
    <h2>Quick Actions</h2><p className="fp-doc-side-copy">Use your document vault without leaving this page.</p>
    <button onClick={()=>dispatch("milevoxa:documents-upload")}><span>＋</span><b>Upload Document</b><em>›</em></button>
    <button onClick={()=>setFolderOpen(v=>!v)}><span>▤</span><b>Create Folder</b><em>›</em></button>
    <button onClick={()=>dispatch("milevoxa:documents-bulk-import")}><span>⇧</span><b>Import Multiple Files</b><em>›</em></button>
    <button onClick={()=>dispatch("milevoxa:documents-view-expiring")}><span>◷</span><b>View Expiring</b><em>›</em></button>
    {folderOpen&&<form className="fp-doc-folder-form" onSubmit={createFolder}><label><span>Folder Name</span><input autoFocus value={name} onChange={e=>setName(e.target.value)} placeholder="Permits 2026"/></label>{error&&<small className="error">{error}</small>}<div><button type="button" onClick={()=>setFolderOpen(false)}>Cancel</button><button type="submit" disabled={saving||!name.trim()}>{saving?"Creating...":"Create"}</button></div></form>}
  </section>
}
