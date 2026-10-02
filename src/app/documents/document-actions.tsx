"use client";

import { FormEvent, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { DOCUMENT_TYPES } from "@/lib/document-domain";

type Truck = { id: string; unit_number: string };
type Folder = { id: string; name: string };

export type EditableDocument = {
  id: string;
  name: string;
  document_type: string | null;
  truck_id: string | null;
  folder_id: string | null;
  jurisdiction: string | null;
  issue_date: string | null;
  effective_date: string | null;
  expiration_date: string | null;
  document_number: string | null;
  carry_in_truck: boolean;
  notes: string | null;
  storage_path: string;
};

export default function DocumentActions({
  document: doc,
  trucks,
  folders,
}: {
  document: EditableDocument;
  trucks: Truck[];
  folders: Folder[];
}) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function openDocument() {
    const supabase = createClient();
    const { data, error } = await supabase.storage
      .from("fleet-documents")
      .createSignedUrl(doc.storage_path, 60);

    if (error || !data?.signedUrl) {
      alert(error?.message || "Could not open document.");
      return;
    }

    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  async function saveDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaving(true);
    setError("");

    const supabase = createClient();
    const { error } = await supabase
      .from("documents")
      .update({
        name: String(form.get("name") || "").trim() || doc.name,
        document_type: String(form.get("document_type") || "Other"),
        truck_id: String(form.get("truck_id") || "") || null,
        folder_id: String(form.get("folder_id") || "") || null,
        jurisdiction: String(form.get("jurisdiction") || "").trim() || null,
        issue_date: String(form.get("issue_date") || "") || null,
        effective_date: String(form.get("effective_date") || "") || null,
        expiration_date: String(form.get("expiration_date") || "") || null,
        document_number: String(form.get("document_number") || "").trim() || null,
        carry_in_truck: form.get("carry_in_truck") === "on",
        notes: String(form.get("notes") || "").trim() || null,
      })
      .eq("id", doc.id);

    if (error) {
      setError(error.message);
      setSaving(false);
      return;
    }

    setSaving(false);
    setEditOpen(false);
    router.refresh();
  }

  async function removeDocument() {
    if (!confirm("Delete this document?")) return;

    const supabase = createClient();
    const { error: storageError } = await supabase.storage
      .from("fleet-documents")
      .remove([doc.storage_path]);

    if (storageError) {
      alert(storageError.message);
      return;
    }

    const { error } = await supabase.from("documents").delete().eq("id", doc.id);
    if (error) {
      alert(error.message);
      return;
    }

    router.refresh();
  }

  return (
    <>
      <div className="fp-document-actions">
        <button onClick={openDocument}>Open</button>
        <button className="edit" onClick={() => setEditOpen(true)}>Edit</button>
        <button onClick={removeDocument}>Delete</button>
      </div>

      {editOpen &&
        typeof window !== "undefined" &&
        createPortal(
          <div
            className="fp-doc-modal-backdrop"
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setEditOpen(false);
            }}
          >
            <div className="fp-doc-modal" role="dialog" aria-modal="true" aria-label="Edit Document">
              <form onSubmit={saveDocument} className="fp-document-upload-form fp-document-upload-form-v2">
                <div className="fp-doc-form-heading">
                  <div>
                    <span>DOCUMENT VAULT</span>
                    <h2>Edit Document Information</h2>
                    <p>Update the details without replacing the uploaded file.</p>
                  </div>
                  <button type="button" onClick={() => setEditOpen(false)}>×</button>
                </div>

                <div className="fp-doc-form-grid">
                  <label className="span-2">
                    <span>Document Name</span>
                    <input name="name" defaultValue={doc.name} required />
                  </label>

                  <label>
                    <span>Document Type</span>
                    <select name="document_type" defaultValue={doc.document_type || "Other"}>
                      {DOCUMENT_TYPES.map((type) => <option key={type}>{type}</option>)}
                    </select>
                  </label>

                  <label>
                    <span>Truck</span>
                    <select name="truck_id" defaultValue={doc.truck_id || ""}>
                      <option value="">Company / No truck</option>
                      {trucks.map((truck) => (
                        <option key={truck.id} value={truck.id}>Truck #{truck.unit_number}</option>
                      ))}
                    </select>
                  </label>

                  <label>
                    <span>Folder</span>
                    <select name="folder_id" defaultValue={doc.folder_id || ""}>
                      <option value="">No folder</option>
                      {folders.map((folder) => (
                        <option key={folder.id} value={folder.id}>{folder.name}</option>
                      ))}
                    </select>
                  </label>

                  <label>
                    <span>Jurisdiction</span>
                    <input name="jurisdiction" defaultValue={doc.jurisdiction || ""} placeholder="IN, NY, NM, OR..." />
                  </label>

                  <label>
                    <span>Issue Date</span>
                    <input name="issue_date" type="date" defaultValue={doc.issue_date || ""} />
                  </label>

                  <label>
                    <span>Effective Date</span>
                    <input name="effective_date" type="date" defaultValue={doc.effective_date || ""} />
                  </label>

                  <label>
                    <span>Expiration Date</span>
                    <input name="expiration_date" type="date" defaultValue={doc.expiration_date || ""} />
                  </label>

                  <label>
                    <span>Document / Credential #</span>
                    <input name="document_number" defaultValue={doc.document_number || ""} placeholder="Optional" />
                  </label>

                  <label className="span-2 fp-doc-carry-toggle">
                    <input name="carry_in_truck" type="checkbox" defaultChecked={doc.carry_in_truck} />
                    <span>
                      <b>Keep in Truck Pack</b>
                      <small>Mark documents the driver should be able to pull up quickly.</small>
                    </span>
                  </label>

                  <label className="span-2">
                    <span>Notes</span>
                    <textarea name="notes" rows={3} defaultValue={doc.notes || ""} placeholder="Restrictions, renewal details, notes..." />
                  </label>
                </div>

                <div className="fp-doc-edit-file-note">
                  <b>File stays unchanged</b>
                  <span>Only the document information is updated. The uploaded file is not replaced.</span>
                </div>

                {error && <div className="fp-document-form-error">{error}</div>}

                <div className="fp-document-form-actions">
                  <button type="button" onClick={() => setEditOpen(false)}>Cancel</button>
                  <button disabled={saving}>{saving ? "Saving..." : "Save Changes"}</button>
                </div>
              </form>
            </div>
          </div>,
          window.document.body
        )}
    </>
  );
}
