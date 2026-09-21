"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import MileVoxaBrand from "@/components/milevoxa-brand";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setMessage("");
    setError("");

    try {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/auth/callback?next=/reset-password`;
      const { error: resetError } =
        await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo,
        });

      if (resetError) throw resetError;

      setMessage(
        "If an account exists for that email, MileVoxa sent a secure password-reset link."
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not send the password-reset email."
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F7F9F8] px-5 py-10">
      <div className="mx-auto w-full max-w-[430px]">
        <MileVoxaBrand showTagline={false} className="mb-10 justify-center" />

        <div className="mb-8">
          <h1 className="text-4xl font-black tracking-[-.04em] text-[#102238]">
            Reset your password
          </h1>
          <div className="mt-3 text-[10px] font-black uppercase tracking-[.18em] text-[#16853B]">
            MileVoxa Account Recovery
          </div>
          <p className="mt-3 text-sm leading-6 text-[#6d7f94]">
            Enter your account email and we’ll send you a secure reset link.
          </p>
        </div>

        <div className="fleet-card rounded-[28px] p-7 sm:p-8">
          <form onSubmit={submit} className="space-y-5">
            <label className="block">
              <span className="mb-2 block text-[10px] font-black uppercase tracking-[.12em] text-[#7b8da2]">
                Email
              </span>
              <input
                required
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="mv-auth-input"
              />
            </label>

            {message && (
              <div className="rounded-xl border border-[#16853B]/20 bg-[#EAF6EC] px-4 py-3 text-sm text-[#126F32]">
                {message}
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <button disabled={sending} className="mv-auth-primary">
              {sending ? "Sending reset link..." : "Send Reset Link →"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-[#7b8da2]">
            Remembered your password?{" "}
            <Link href="/login" className="font-black text-[#16853B]">
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
