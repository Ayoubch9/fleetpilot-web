"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Truck = { id: string; unit_number: string };

export default function DocumentManager({
  companyId,
  trucks,
}: {
  companyId: string;
  trucks: Truck[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    const form = new FormData(event.currentTarget);
    const file = form.get("file");

    if (!(file instanceof File) || file.size === 0) {
      setError("Choose a document file.");
      setSaving(false);
      return;
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Your session expired. Please sign in again.");
      setSaving(false);
      return;
    }

    const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `${companyId}/${Date.now()}-${cleanName}`;

    const { error: uploadError } = await supabase.storage
      .from("fleet-documents")
      .upload(storagePath, file, { upsert: false });

    if (uploadError) {
      setError(uploadError.message);
      setSaving(false);
      return;
    }

    const { error: insertError } = await supabase.from("documents").insert({
      company_id: companyId,
      uploaded_by: user.id,
      name: String(form.get("name") || file.name).trim(),
      document_type: String(form.get("document_type") || "Other"),
      truck_id: String(form.get("truck_id") || "") || null,
      expiration_date: String(form.get("expiration_date") || "") || null,
      storage_path: storagePath,
      file_name: file.name,
      mime_type: file.type || null,
      file_size: file.size,
    });

    if (insertError) {
      await supabase.storage.from("fleet-documents").remove([storagePath]);
      setError(insertError.message);
      setSaving(false);
      return;
    }

    event.currentTarget.reset();
    setSaving(false);
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button className="fp-primary-btn" onClick={() => setOpen((value) => !value)}>
        {open ? "Close" : "＋ Upload Document"}
      </button>

      {open && (
        <form onSubmit={upload} className="fp-document-upload-form">
          <label>
            <span>Document Name</span>
            <input name="name" placeholder="Insurance Policy" />
          </label>

          <label>
            <span>Document Type</span>
            <select name="document_type" defaultValue="Other">
              <option>Registration</option>
              <option>Insurance</option>
              <option>DOT</option>
              <option>Maintenance</option>
              <option>Compliance</option>
              <option>Business</option>
              <option>Other</option>
            </select>
          </label>

          <label>
            <span>Truck</span>
            <select name="truck_id" defaultValue="">
              <option value="">Company / No truck</option>
              {trucks.map((truck) => (
                <option key={truck.id} value={truck.id}>
                  Truck #{truck.unit_number}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Expiration Date</span>
            <input name="expiration_date" type="date" min={today} />
          </label>

          <label className="fp-document-file-field">
            <span>File</span>
            <input name="file" type="file" required />
          </label>

          {error && <div className="fp-document-form-error">{error}</div>}

          <div className="fp-document-form-actions">
            <button type="button" onClick={() => setOpen(false)}>Cancel</button>
            <button disabled={saving}>{saving ? "Uploading..." : "Upload Document"}</button>
          </div>
        </form>
      )}
    </>
  );
}
