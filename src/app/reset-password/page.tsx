"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import MileVoxaBrand from "@/components/milevoxa-brand";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [checking, setChecking] = useState(true);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function verifyRecoverySession() {
      const supabase = createClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (!active) return;

      setReady(Boolean(user) && !userError);
      setChecking(false);

      if (!user || userError) {
        setError(
          "This reset link is invalid or has expired. Request a new password-reset email."
        );
      }
    }

    void verifyRecoverySession();

    return () => {
      active = false;
    };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Use at least 8 characters for your new password.");
      return;
    }

    if (password !== confirmation) {
      setError("The passwords do not match.");
      return;
    }

    setSaving(true);

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) throw updateError;

      setDone(true);
      setPassword("");
      setConfirmation("");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not update your password."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F7F9F8] px-5 py-10">
      <div className="mx-auto w-full max-w-[430px]">
        <MileVoxaBrand showTagline={false} className="mb-10 justify-center" />

        <div className="mb-8">
          <h1 className="text-4xl font-black tracking-[-.04em] text-[#102238]">
            Choose a new password
          </h1>
          <div className="mt-3 text-[10px] font-black uppercase tracking-[.18em] text-[#16853B]">
            Secure Account Recovery
          </div>
          <p className="mt-3 text-sm leading-6 text-[#6d7f94]">
            Set a new password for your MileVoxa account.
          </p>
        </div>

        <div className="fleet-card rounded-[28px] p-7 sm:p-8">
          {checking ? (
            <div className="text-sm text-[#64748B]">
              Checking your secure reset link...
            </div>
          ) : done ? (
            <div className="space-y-5">
              <div className="rounded-xl border border-[#16853B]/20 bg-[#EAF6EC] px-4 py-3 text-sm text-[#126F32]">
                Your MileVoxa password has been updated successfully.
              </div>
              <Link
                href="/login"
                className="mv-auth-primary flex items-center justify-center"
              >
                Continue to Sign In →
              </Link>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-5">
              <PasswordField
                label="New password"
                value={password}
                set={setPassword}
                autoComplete="new-password"
              />
              <PasswordField
                label="Confirm new password"
                value={confirmation}
                set={setConfirmation}
                autoComplete="new-password"
              />

              {error && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <button disabled={saving || !ready} className="mv-auth-primary">
                {saving ? "Updating password..." : "Set New Password →"}
              </button>

              {!ready && (
                <div className="text-center text-sm text-[#7b8da2]">
                  <Link
                    href="/forgot-password"
                    className="font-black text-[#16853B]"
                  >
                    Request a new reset link
                  </Link>
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </main>
  );
}

function PasswordField({
  label,
  value,
  set,
  autoComplete,
}: {
  label: string;
  value: string;
  set: (value: string) => void;
  autoComplete: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[10px] font-black uppercase tracking-[.12em] text-[#7b8da2]">
        {label}
      </span>
      <input
        required
        minLength={8}
        type="password"
        autoComplete={autoComplete}
        value={value}
        onChange={(event) => set(event.target.value)}
        className="mv-auth-input"
      />
    </label>
  );
}
