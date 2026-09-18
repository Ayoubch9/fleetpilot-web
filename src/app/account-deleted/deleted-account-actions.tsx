"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function DeletedAccountActions({
  signedIn,
  previouslyDeleted,
  justDeleted,
}: {
  signedIn: boolean;
  previouslyDeleted: boolean;
  justDeleted: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function startFresh() {
    setBusy(true);
    setError("");

    try {
      const supabase = createClient();
      const { data, error: rpcError } = await supabase.rpc(
        "reactivate_fleetpilot_deleted_account"
      );

      if (rpcError) {
        throw new Error(
          [rpcError.message, rpcError.details, rpcError.hint]
            .filter(Boolean)
            .join(" · ")
        );
      }

      if (data !== true) {
        throw new Error(
          "FleetPilot could not prepare a new blank account."
        );
      }

      router.replace("/onboarding");
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not start a new FleetPilot account."
      );
      setBusy(false);
    }
  }

  async function signOut() {
    setBusy(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="fp-deleted-account-actions">
      {signedIn && previouslyDeleted ? (
        <>
          <button
            type="button"
            className="primary"
            disabled={busy}
            onClick={() => void startFresh()}
          >
            {busy
              ? "Preparing new account..."
              : "Create a New Blank FleetPilot Account"}
          </button>
          <button
            type="button"
            className="secondary"
            disabled={busy}
            onClick={() => void signOut()}
          >
            Sign Out
          </button>
        </>
      ) : (
        <>
          <Link href="/signup" className="primary">
            Create Account
          </Link>
          <Link href="/login" className="secondary">
            Sign In
          </Link>
        </>
      )}

      {justDeleted && (
        <small>
          Signing in again with the same Google address will not restore the
          deleted data. FleetPilot will ask before creating a new blank account.
        </small>
      )}

      {error && (
        <div className="fp-deleted-account-error">{error}</div>
      )}
    </div>
  );
}
