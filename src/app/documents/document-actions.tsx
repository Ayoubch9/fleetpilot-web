"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function DocumentActions({
  id,
  storagePath,
}: {
  id: string;
  storagePath: string;
}) {
  const router = useRouter();

  async function openDocument() {
    const supabase = createClient();
    const { data, error } = await supabase.storage
      .from("fleet-documents")
      .createSignedUrl(storagePath, 60);

    if (error || !data?.signedUrl) {
      alert(error?.message || "Could not open document.");
      return;
    }

    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  async function removeDocument() {
    if (!confirm("Delete this document?")) return;

    const supabase = createClient();
    const { error: storageError } = await supabase.storage
      .from("fleet-documents")
      .remove([storagePath]);

    if (storageError) {
      alert(storageError.message);
      return;
    }

    const { error } = await supabase.from("documents").delete().eq("id", id);
    if (error) {
      alert(error.message);
      return;
    }

    router.refresh();
  }

  return (
    <div className="fp-document-actions">
      <button onClick={openDocument}>Open</button>
      <button onClick={removeDocument}>Delete</button>
    </div>
  );
}
