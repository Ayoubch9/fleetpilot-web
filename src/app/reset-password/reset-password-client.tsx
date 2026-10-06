"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type Step = "ready" | "verifying" | "verified" | "saving" | "success" | "error";

function createBrowserSupabase(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("MileVoxa authentication is temporarily unavailable.");
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export default function ResetPasswordClient() {
  const searchParams = useSearchParams();

  const tokenHash = (searchParams.get("token_hash") ?? "").trim();
  const type = (searchParams.get("type") ?? "").trim();

  const hasValidLinkShape = tokenHash.length > 0 && type === "recovery";

  const [step, setStep] = useState<Step>(
    hasValidLinkShape ? "ready" : "error",
  );
  const [errorMessage, setErrorMessage] = useState(
    hasValidLinkShape
      ? ""
      : "This password-reset link is incomplete. Please request a new reset email.",
  );
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const canSubmit = useMemo(() => {
    return (
      password.length >= 8 &&
      confirmPassword.length >= 8 &&
      password === confirmPassword &&
      step === "verified"
    );
  }, [password, confirmPassword, step]);

  async function verifyRecoveryLink() {
    if (!hasValidLinkShape || step === "verifying") return;

    setStep("verifying");
    setErrorMessage("");

    try {
      const client = createBrowserSupabase();

      const { data, error } = await client.auth.verifyOtp({
        token_hash: tokenHash,
        type: "recovery",
      });

      if (error) throw error;
      if (!data.session) {
        throw new Error(
          "MileVoxa could not create a recovery session from this link.",
        );
      }

      setSupabase(client);
      setStep("verified");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "This recovery link could not be verified.";

      setErrorMessage(
        message.toLowerCase().includes("expired") ||
          message.toLowerCase().includes("invalid")
          ? "This password-reset link is expired or has already been used. Please request a new reset email."
          : message,
      );
      setStep("error");
    }
  }

  async function updatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase || step !== "verified") return;

    if (password.length < 8) {
      setErrorMessage("Use at least 8 characters for your new password.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("The passwords do not match.");
      return;
    }

    setStep("saving");
    setErrorMessage("");

    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) throw error;

      await supabase.auth.signOut();

      setPassword("");
      setConfirmPassword("");
      setStep("success");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "MileVoxa could not update your password.",
      );
      setStep("verified");
    }
  }

  return (
    <main className="min-h-screen bg-[#F5F7F9] px-5 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto flex min-h-[72vh] max-w-xl items-center">
        <section className="w-full rounded-[28px] border border-[#E4E7EC] bg-white p-6 shadow-[0_18px_60px_rgba(16,34,56,0.10)] sm:p-9">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF6EC] text-xl font-black text-[#16853B]">
            M
          </div>

          <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.14em] text-[#16853B]">
            MileVoxa secure recovery
          </p>

          <h1 className="text-3xl font-black tracking-[-0.035em] text-[#102238]">
            {step === "success" ? "Password updated" : "Reset your password"}
          </h1>

          {step === "ready" && (
            <>
              <p className="mt-4 leading-7 text-[#667085]">
                For your security, confirm this reset request before choosing a
                new password. The recovery token is not verified until you tap
                the button below.
              </p>

              <button
                type="button"
                onClick={verifyRecoveryLink}
                className="mt-7 w-full rounded-2xl bg-[#16853B] px-5 py-3.5 text-base font-extrabold text-white transition hover:opacity-95"
              >
                Continue securely
              </button>
            </>
          )}

          {step === "verifying" && (
            <div className="mt-6 rounded-2xl bg-[#F7F9F8] p-5">
              <p className="font-semibold text-[#102238]">
                Verifying your recovery link…
              </p>
              <p className="mt-1 text-sm text-[#667085]">
                This should only take a moment.
              </p>
            </div>
          )}

          {(step === "verified" || step === "saving") && (
            <form onSubmit={updatePassword} className="mt-7 space-y-5">
              <div>
                <label
                  htmlFor="new-password"
                  className="mb-2 block text-sm font-bold text-[#102238]"
                >
                  New password
                </label>
                <input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  disabled={step === "saving"}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-2xl border border-[#D0D5DD] bg-white px-4 py-3.5 text-[#102238] outline-none transition focus:border-[#16853B] focus:ring-4 focus:ring-[#16853B]/10 disabled:opacity-60"
                  placeholder="At least 8 characters"
                />
              </div>

              <div>
                <label
                  htmlFor="confirm-password"
                  className="mb-2 block text-sm font-bold text-[#102238]"
                >
                  Confirm new password
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  disabled={step === "saving"}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="w-full rounded-2xl border border-[#D0D5DD] bg-white px-4 py-3.5 text-[#102238] outline-none transition focus:border-[#16853B] focus:ring-4 focus:ring-[#16853B]/10 disabled:opacity-60"
                  placeholder="Enter the same password again"
                />
              </div>

              {password.length > 0 &&
                confirmPassword.length > 0 &&
                password !== confirmPassword && (
                  <p className="text-sm font-semibold text-red-600">
                    The passwords do not match.
                  </p>
                )}

              {errorMessage && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
                  {errorMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={!canSubmit || step === "saving"}
                className="w-full rounded-2xl bg-[#16853B] px-5 py-3.5 text-base font-extrabold text-white transition enabled:hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-45"
              >
                {step === "saving" ? "Updating password…" : "Update password"}
              </button>

              <p className="text-center text-xs leading-5 text-[#667085]">
                MileVoxa will sign out the temporary recovery session after your
                password is changed.
              </p>
            </form>
          )}

          {step === "success" && (
            <div className="mt-6">
              <div className="rounded-2xl border border-[#B7E2C1] bg-[#EAF6EC] p-5">
                <p className="font-extrabold text-[#102238]">
                  Your new password is ready.
                </p>
                <p className="mt-1 text-sm leading-6 text-[#667085]">
                  Sign in to MileVoxa with your email address and the new
                  password.
                </p>
              </div>

              <Link
                href="/login"
                className="mt-6 block w-full rounded-2xl bg-[#102238] px-5 py-3.5 text-center text-base font-extrabold text-white transition hover:opacity-95"
              >
                Sign in to MileVoxa
              </Link>
            </div>
          )}

          {step === "error" && (
            <div className="mt-6">
              <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
                <p className="font-bold text-red-700">Reset link unavailable</p>
                <p className="mt-2 text-sm leading-6 text-red-700/90">
                  {errorMessage}
                </p>
              </div>

              <Link
                href="/forgot-password"
                className="mt-6 block w-full rounded-2xl bg-[#102238] px-5 py-3.5 text-center text-base font-extrabold text-white transition hover:opacity-95"
              >
                Request a new reset email
              </Link>
            </div>
          )}

          <div className="mt-7 border-t border-[#EAECF0] pt-5 text-center">
            <Link
              href="/login"
              className="text-sm font-bold text-[#16853B] hover:underline"
            >
              Back to sign in
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
