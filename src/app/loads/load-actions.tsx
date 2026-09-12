"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const statuses = ["UPCOMING", "IN TRANSIT", "DELIVERED", "COMPLETED", "CANCELLED"];

export default function LoadActions({
  id,
  status,
}: {
  id: string;
  status: string | null;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function changeStatus(value: string) {
    setSaving(true);
    const supabase = createClient();
    await supabase.from("loads").update({ status: value }).eq("id", id);
    setSaving(false);
    router.refresh();
  }

  return (
    <select
      disabled={saving}
      value={(status || "UPCOMING").toUpperCase()}
      onChange={(e) => changeStatus(e.target.value)}
      className="rounded-[5px] border border-[#dce5ef] bg-[#f8fbfe] px-2 py-1.5 text-[9px] font-black text-[#0b1730]"
    >
      {statuses.map((item) => (
        <option key={item} value={item}>
          {item}
        </option>
      ))}
    </select>
  );
}
