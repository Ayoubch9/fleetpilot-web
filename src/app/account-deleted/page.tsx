import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import DeletedAccountActions from "./deleted-account-actions";
import MileVoxaBrand from "@/components/milevoxa-brand";

export const metadata = {
  title: "Account Deleted",
  description:
    "MileVoxa account deletion and deleted-account sign-in handling.",
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
        <MileVoxaBrand showTagline={false} className="fp-deleted-account-brand" />

        <div className="fp-deleted-account-icon">✓</div>

        {justDeleted ? (
          <>
            <span className="fp-deleted-account-eyebrow">
              ACCOUNT DELETED
            </span>
            <h1>Your MileVoxa account has been deleted.</h1>
            <p>
              Your active MileVoxa account and its eligible company data were
              removed. A minimal deletion record is retained so MileVoxa does
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
              The previous MileVoxa account was deleted. We have not restored
              the old business data or automatically created a new company.
            </p>
          </>
        ) : (
          <>
            <span className="fp-deleted-account-eyebrow">
              ACCOUNT STATUS
            </span>
            <h1>No active MileVoxa account is connected.</h1>
            <p>
              You can return to sign in or create a new MileVoxa account.
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
