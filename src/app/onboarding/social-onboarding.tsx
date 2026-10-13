"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import MileVoxaBrand from "@/components/milevoxa-brand";
import { BUSINESS_ROLES } from "@/lib/business-roles";

function formatSupabaseError(error: {
  message?: string;
  details?: string;
  hint?: string;
  code?: string;
}) {
  const parts = [error.message, error.details, error.hint]
    .filter(Boolean)
    .map(String);

  if (error.code) parts.push(`Code: ${error.code}`);

  return parts.join(" · ") || "Could not finish MileVoxa setup.";
}

function extractErrorMessage(caught: unknown) {
  if (caught instanceof Error) return caught.message;

  if (caught && typeof caught === "object") {
    return formatSupabaseError(
      caught as {
        message?: string;
        details?: string;
        hint?: string;
        code?: string;
      }
    );
  }

  return "Could not finish MileVoxa setup.";
}


export default function SocialOnboarding({
  email,
  provider,
  suggestedName,
  suggestedCompanyName,
  suggestedRole,
  suggestedDotNumber,
  suggestedMcNumber,
}: {
  email: string;
  provider: "Google" | "email";
  suggestedName: string;
  suggestedCompanyName: string;
  suggestedRole: string;
  suggestedDotNumber: string;
  suggestedMcNumber: string;
}) {
  const router = useRouter();
  const [fullName, setFullName] = useState(suggestedName);
  const [companyName, setCompanyName] = useState(suggestedCompanyName);
  const [businessRole, setBusinessRole] = useState(suggestedRole);
  const [dotNumber, setDotNumber] = useState(suggestedDotNumber);
  const [mcNumber, setMcNumber] = useState(suggestedMcNumber);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function complete(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error: rpcError } = await supabase.rpc(
        "complete_fleetpilot_social_onboarding",
        {
          p_full_name: fullName.trim(),
          p_company_name: companyName.trim(),
          p_business_role: businessRole,
          p_dot_number: dotNumber.trim() || null,
          p_mc_number: mcNumber.trim() || null,
        }
      );

      if (rpcError) {
        throw new Error(formatSupabaseError(rpcError));
      }

      const result = data as
        | { ok?: boolean; company_id?: string; profile_saved?: boolean }
        | null;

      if (!result?.ok || !result.company_id) {
        throw new Error(
          "MileVoxa did not receive a valid company from Supabase."
        );
      }

      const { error: metadataError } = await supabase.auth.updateUser({
        data: { profile_setup_required: false, business_role: businessRole },
      });
      if (metadataError) throw metadataError;

      router.replace("/dashboard");
      router.refresh();
    } catch (caught) {
      setError(extractErrorMessage(caught));
      setLoading(false);
    }
  }

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <main className="fp-social-onboarding-page">
      <section className="fp-social-onboarding-brand">
        <MileVoxaBrand onDark showTagline={false} className="fp-social-onboarding-logo" />

        <div>
          <span>ONE LAST STEP</span>
          <h1>Set up your MileVoxa company.</h1>
          <p>
            Your {provider === "Google" ? "Google" : "email"} account is connected. Now create the trucking
            company workspace that will be shared across MileVoxa web and
            mobile.
          </p>
        </div>

        <small>Run your trucking business with clarity.</small>
      </section>

      <section className="fp-social-onboarding-content">
        <div className="fp-social-onboarding-shell">
          <div className="fp-social-onboarding-provider">
            <div className="google">G</div>
            <div>
              <span>Signed in with {provider}</span>
              <strong>{email}</strong>
            </div>
          </div>

          <div className="fp-social-onboarding-heading">
            <span>MILEVOXA ACCOUNT</span>
            <h2>Complete your profile</h2>
            <p>
              This information belongs to your MileVoxa account, not your
              Google account.
            </p>
          </div>

          <form onSubmit={complete}>
            <label>
              <span>Your Name</span>
              <input
                required
                value={fullName}
                placeholder="Full name"
                onChange={(event) => setFullName(event.target.value)}
              />
            </label>

            <label>
              <span>Company Name</span>
              <input
                required
                value={companyName}
                placeholder="Your trucking company"
                onChange={(event) => setCompanyName(event.target.value)}
              />
            </label>

            <label>
              <span>Your Role</span>
              <select
                required
                value={businessRole}
                onChange={(event) => setBusinessRole(event.target.value)}
              >
                <option value="" disabled>Select your role</option>
                {BUSINESS_ROLES.map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </label>

            <div className="fp-social-onboarding-identifiers">
              <label>
                <span>USDOT Number <small>(optional)</small></span>
                <input
                  value={dotNumber}
                  inputMode="numeric"
                  placeholder="USDOT number"
                  onChange={(event) => setDotNumber(event.target.value)}
                />
              </label>
              <label>
                <span>MC Number <small>(optional)</small></span>
                <input
                  value={mcNumber}
                  placeholder="MC number"
                  onChange={(event) => setMcNumber(event.target.value)}
                />
              </label>
            </div>

            {error && (
              <div className="fp-social-onboarding-error">{error}</div>
            )}

            <button
              type="submit"
              disabled={
                loading || !fullName.trim() || !companyName.trim() || !businessRole
              }
            >
              {loading ? "Saving your profile..." : "Open MileVoxa →"}
            </button>
          </form>

          <button
            type="button"
            className="fp-social-onboarding-cancel"
            onClick={() => void signOut()}
          >
            Use a different account
          </button>
        </div>
      </section>
    </main>
  );
}
