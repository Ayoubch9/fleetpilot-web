import Link from "next/link";
import PublicLayout from "@/components/public-layout";
import { createClient } from "@/lib/supabase/server";

export default async function NotFound() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <PublicLayout mainClassName="fp-state-page fp-public-not-found">
      <div className="fp-state-card">
        <div className="fp-public-eyebrow">404 ERROR</div>
        <div className="fp-state-icon">404</div>
        <h1>Page not found</h1>
        <p>
          This MileVoxa page does not exist or the address has changed.
        </p>
        <div className="fp-state-actions">
          <Link href={user ? "/dashboard" : "/"}>
            {user ? "Back to Dashboard" : "Back to home"}
          </Link>
          <Link href="/tools">Free Tools</Link>
        </div>
      </div>
    </PublicLayout>
  );
}
