import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import DeletedAccountActions from "./deleted-account-actions";

export const metadata = {
  title: "Account Deleted",
  description:
    "FleetPilot account deletion and deleted-account sign-in handling.",
};

export default async function AccountDeletedPage({
  searchParams,
}: {
  searchParams: Promise<{ done?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let previouslyDeleted = false;

  if (user) {
    const { data } = await supabase.rpc(
      "is_fleetpilot_deleted_account"
    );
    previouslyDeleted = data === true;
  }

  const justDeleted = params.done === "1";

  return (
    <main className="fp-deleted-account-page">
      <section className="fp-deleted-account-card">
        <Link href="/" className="fp-deleted-account-brand">
          Fleet<span>Pilot</span>
        </Link>

        <div className="fp-deleted-account-icon">✓</div>

        {justDeleted ? (
          <>
            <span className="fp-deleted-account-eyebrow">
              ACCOUNT DELETED
            </span>
            <h1>Your FleetPilot account has been deleted.</h1>
            <p>
              Your active FleetPilot account and its eligible company data were
              removed. A minimal deletion record is retained so FleetPilot does
              not silently recreate the old account if the same Google address
              signs in again.
            </p>
          </>
        ) : previouslyDeleted ? (
          <>
            <span className="fp-deleted-account-eyebrow">
              PREVIOUSLY DELETED ACCOUNT
            </span>
            <h1>This Google account was used before.</h1>
            <p>
              The previous FleetPilot account was deleted. We have not restored
              the old business data or automatically created a new company.
            </p>
          </>
        ) : (
          <>
            <span className="fp-deleted-account-eyebrow">
              ACCOUNT STATUS
            </span>
            <h1>No active FleetPilot account is connected.</h1>
            <p>
              You can return to sign in or create a new FleetPilot account.
            </p>
          </>
        )}

        <DeletedAccountActions
          signedIn={Boolean(user)}
          previouslyDeleted={previouslyDeleted}
          justDeleted={justDeleted}
        />

        <div className="fp-deleted-account-links">
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/terms">Terms of Service</Link>
          <Link href="/data-deletion">Data Deletion</Link>
        </div>
      </section>
    </main>
  );
}
