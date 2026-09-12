"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function TruckActions({
  id,
  currentStatus,
}: {
  id: string;
  currentStatus: string | null;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const active = (currentStatus || "").toUpperCase() !== "INACTIVE";

  async function toggleStatus() {
    setSaving(true);
    const supabase = createClient();

    await supabase
      .from("trucks")
      .update({ status: active ? "INACTIVE" : "ACTIVE" })
      .eq("id", id);

    setSaving(false);
    router.refresh();
  }

  return (
    <button
      onClick={toggleStatus}
      disabled={saving}
      className={`rounded-[5px] px-2.5 py-1.5 text-[9px] font-black ${
        active
          ? "bg-red-50 text-red-600"
          : "bg-[#36d575]/10 text-[#62e28e]"
      } disabled:opacity-50`}
    >
      {saving ? "Saving..." : active ? "Deactivate" : "Activate"}
    </button>
  );
}
