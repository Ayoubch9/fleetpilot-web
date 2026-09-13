"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function SidebarSignOut() {
  const [busy, setBusy] = useState(false);

  async function signOut() {
    if (busy) return;

    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      setBusy(false);
      window.alert(error.message);
      return;
    }

    window.location.href = "/login";
  }

  return (
    <button
      type="button"
      onClick={signOut}
      disabled={busy}
      className="fp-sidebar-signout"
      aria-label="Sign out of FleetPilot"
    >
      <SignOutIcon />
      <span>{busy ? "Signing Out..." : "Sign Out"}</span>
    </button>
  );
}

function SignOutIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[15px] w-[15px] fill-none stroke-current"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M10 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h5" />
      <path d="m15 8 4 4-4 4" />
      <path d="M9 12h10" />
    </svg>
  );
}
