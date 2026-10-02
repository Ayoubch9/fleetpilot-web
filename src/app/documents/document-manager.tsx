"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { DOCUMENT_TYPES } from "@/lib/document-domain";

type Truck={id:string;unit_number:string};
type Folder={id:string;name:string};

export default function DocumentManager({companyId,trucks,folders}:{companyId:string;trucks:Truck[];folders:Folder[]}) {
  const router=useRouter();
  const [open,setOpen]=useState(false);
  const [bulkOpen,setBulkOpen]=useState(false);
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState("");
  const today=useMemo(()=>new Date().toISOString().slice(0,10),[]);

  useEffect(()=>{
    const a=()=>{setBulkOpen(false);setOpen(true)};
    const b=()=>{setOpen(false);setBulkOpen(true)};
    window.addEventListener("milevoxa:documents-upload",a);
    window.addEventListener("milevoxa:documents-bulk-import",b);
    return()=>{window.removeEventListener("milevoxa:documents-upload",a);window.removeEventListener("milevoxa:documents-bulk-import",b)};
  },[]);

  async function uploadOne(file:File, form:FormData, fallback?:string){
    const supabase=createClient();
    const {data:{user}}=await supabase.auth.getUser();
    if(!user) return {ok:false,message:"Your session expired. Please sign in again."} as const;

    const clean=file.name.replace(/[^a-zA-Z0-9._-]/g,"_");
    const path=`${companyId}/${Date.now()}-${crypto.randomUUID()}-${clean}`;
    const up=await supabase.storage.from("fleet-documents").upload(path,file,{upsert:false});
    if(up.error) return {ok:false,message:up.error.message} as const;

    const name=String(form.get("name")||"").trim();
    const ins=await supabase.from("documents").insert({
      company_id:companyId, uploaded_by:user.id,
      name:name||fallback||file.name,
      document_type:String(form.get("document_type")||"Other"),
      truck_id:String(form.get("truck_id")||"")||null,
      folder_id:String(form.get("folder_id")||"")||null,
      jurisdiction:String(form.get("jurisdiction")||"").trim()||null,
      issue_date:String(form.get("issue_date")||"")||null,
      effective_date:String(form.get("effective_date")||"")||null,
      expiration_date:String(form.get("expiration_date")||"")||null,
      document_number:String(form.get("document_number")||"").trim()||null,
      carry_in_truck:form.get("carry_in_truck")==="on",
      notes:String(form.get("notes")||"").trim()||null,
      storage_path:path,file_name:file.name,mime_type:file.type||null,file_size:file.size
    });
    if(ins.error){await supabase.storage.from("fleet-documents").remove([path]);return {ok:false,message:ins.error.message} as const;}
    return {ok:true} as const;
  }

  async function upload(e:FormEvent<HTMLFormElement>){
    e.preventDefault();
    const formElement=e.currentTarget;
    setSaving(true);
    setError("");

    const form=new FormData(formElement);
    const file=form.get("file");

    if(!(file instanceof File)||!file.size){
      setError("Choose a document file.");
      setSaving(false);
      return;
    }

    const result=await uploadOne(file,form);

    if(!result.ok){
      setError(result.message);
      setSaving(false);
      return;
    }

    formElement.reset();
    setSaving(false);
    setOpen(false);
    router.refresh();
  }

  async function bulkUpload(e:FormEvent<HTMLFormElement>){
    e.preventDefault();
    const formElement=e.currentTarget;
    setSaving(true);
    setError("");

    const form=new FormData(formElement);
    const input=formElement.elements.namedItem("files") as HTMLInputElement|null;
    const files=Array.from(input?.files||[]);

    if(!files.length){
      setError("Choose one or more document files.");
      setSaving(false);
      return;
    }

    for(const file of files){
      const result=await uploadOne(file,form,file.name.replace(/\.[^.]+$/,""));

      if(!result.ok){
        setError(`${file.name}: ${result.message}`);
        setSaving(false);
        return;
      }
    }

    formElement.reset();
    setSaving(false);
    setBulkOpen(false);
    router.refresh();
  }

  return <>
    <button className="fp-primary-btn" onClick={()=>{setBulkOpen(false);setOpen(v=>!v)}}>{open?"Close":"＋ Upload Document"}</button>
    {open && typeof document !== "undefined" && createPortal(
      <div className="fp-doc-modal-backdrop" role="presentation" onMouseDown={(event) => {
        if (event.target === event.currentTarget) setOpen(false);
      }}>
        <div className="fp-doc-modal" role="dialog" aria-modal="true" aria-label="Upload Document">
          <form onSubmit={upload} className="fp-document-upload-form fp-document-upload-form-v2">
            <Header title="Upload Truck or Company Document" subtitle="Add searchable metadata for compliance, renewals and driver access." close={()=>setOpen(false)}/>
            <Fields trucks={trucks} folders={folders} today={today} includeName/>
            <label className="fp-document-file-field"><span>File *</span><input name="file" type="file" required/></label>
            {error && <div className="fp-document-form-error">{error}</div>}
            <div className="fp-document-form-actions"><button type="button" onClick={()=>setOpen(false)}>Cancel</button><button disabled={saving}>{saving?"Uploading...":"Upload Document"}</button></div>
          </form>
        </div>
      </div>,
      document.body
    )}
    {bulkOpen && typeof document !== "undefined" && createPortal(
      <div className="fp-doc-modal-backdrop" role="presentation" onMouseDown={(event) => {
        if (event.target === event.currentTarget) setBulkOpen(false);
      }}>
        <div className="fp-doc-modal" role="dialog" aria-modal="true" aria-label="Import Multiple Documents">
          <form onSubmit={bulkUpload} className="fp-document-upload-form fp-document-upload-form-v2">
            <Header title="Import Multiple Documents" subtitle="Upload several files using shared truck, type and folder metadata." close={()=>setBulkOpen(false)}/>
            <Fields trucks={trucks} folders={folders} today={today}/>
            <label className="fp-document-file-field"><span>Files *</span><input name="files" type="file" multiple required/><small>Each file becomes its own document record.</small></label>
            {error && <div className="fp-document-form-error">{error}</div>}
            <div className="fp-document-form-actions"><button type="button" onClick={()=>setBulkOpen(false)}>Cancel</button><button disabled={saving}>{saving?"Importing...":"Import Files"}</button></div>
          </form>
        </div>
      </div>,
      document.body
    )}
  </>;
}

function Header({title,subtitle,close}:{title:string;subtitle:string;close:()=>void}){
  return <div className="fp-doc-form-heading"><div><span>DOCUMENT VAULT</span><h2>{title}</h2><p>{subtitle}</p></div><button type="button" onClick={close}>×</button></div>
}

function Fields({trucks,folders,today,includeName=false}:{trucks:Truck[];folders:Folder[];today:string;includeName?:boolean}){
  return <div className="fp-doc-form-grid">
    {includeName && <label className="span-2"><span>Document Name</span><input name="name" placeholder="2026 Indiana Cab Card"/></label>}
    <label><span>Document Type</span><select name="document_type" defaultValue="Other">{DOCUMENT_TYPES.map(x=><option key={x}>{x}</option>)}</select></label>
    <label><span>Truck</span><select name="truck_id" defaultValue=""><option value="">Company / No truck</option>{trucks.map(t=><option key={t.id} value={t.id}>Truck #{t.unit_number}</option>)}</select></label>
    <label><span>Folder</span><select name="folder_id" defaultValue=""><option value="">No folder</option>{folders.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select></label>
    <label><span>Jurisdiction</span><input name="jurisdiction" placeholder="IN, NY, NM, OR..."/></label>
    <label><span>Issue Date</span><input name="issue_date" type="date"/></label>
    <label><span>Effective Date</span><input name="effective_date" type="date"/></label>
    <label><span>Expiration Date</span><input name="expiration_date" type="date"/></label>
    <label><span>Document / Credential #</span><input name="document_number" placeholder="Optional"/></label>
    <label className="span-2 fp-doc-carry-toggle"><input name="carry_in_truck" type="checkbox"/><span><b>Keep in Truck Pack</b><small>Mark documents the driver should be able to pull up quickly.</small></span></label>
    <label className="span-2"><span>Notes</span><textarea name="notes" rows={2} placeholder="Restrictions, renewal details, notes..."/></label>
  </div>
}
