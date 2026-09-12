"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ExpenseActions({
  id,
  receiptPath,
}: {
  id: string;
  receiptPath: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function remove() {
    if (!confirm("Delete this expense?")) return;
    setBusy(true);

    const supabase = createClient();

    if (receiptPath) {
      await supabase.storage.from("expense-receipts").remove([receiptPath]);
    }

    await supabase.from("expenses").delete().eq("id", id);
    setBusy(false);
    router.refresh();
  }

  return (
    <button
      onClick={remove}
      disabled={busy}
      className="rounded-[5px] bg-red-50 px-2.5 py-1.5 text-[9px] font-black text-red-600"
    >
      {busy ? "Deleting..." : "Delete"}
    </button>
  );
}
