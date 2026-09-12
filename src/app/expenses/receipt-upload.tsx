"use client";

import { ChangeEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ReceiptUpload({
  onUploaded,
}: {
  onUploaded: (path: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [label, setLabel] = useState("Upload Receipt");

  async function pick(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const supabase = createClient();

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `receipts/receipt_${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from("expense-receipts")
      .upload(path, file, { upsert: false });

    if (!error) {
      onUploaded(path);
      setLabel(file.name);
    }

    setUploading(false);
  }

  return (
    <label className="block">
      <span className="mb-2 block text-[8px] font-black uppercase tracking-[.12em] text-[#71859a]">
        Receipt
      </span>
      <span className="flex cursor-pointer items-center justify-center rounded-[7px] border border-dashed border-[#244059] bg-[#f8fbfe] px-4 py-3 text-[10px] font-black text-[#9dafbd]">
        {uploading ? "Uploading..." : label}
      </span>
      <input type="file" accept="image/*,.pdf" className="hidden" onChange={pick} />
    </label>
  );
}
