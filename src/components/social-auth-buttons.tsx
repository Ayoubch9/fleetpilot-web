"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type SocialProvider = "google";

export default function SocialAuthButtons({
  next = "/dashboard",
}: {
  next?: string;
}) {
  const [loading, setLoading] = useState<SocialProvider | null>(null);
  const [error, setError] = useState("");

  async function signIn(provider: SocialProvider) {
    setError("");
    setLoading(provider);

    try {
      const supabase = createClient();
      const callback = new URL("/auth/callback", window.location.origin);
      callback.searchParams.set("next", next);

      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: callback.toString(),
        },
      });

      if (oauthError) {
        throw oauthError;
      }
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : `Could not continue with ${provider}.`
      );
      setLoading(null);
    }
  }

  return (
    <div className="fp-social-auth">
      <button
        type="button"
        className="fp-social-auth-button"
        disabled={Boolean(loading)}
        onClick={() => void signIn("google")}
      >
        <GoogleIcon />
        <span>
          {loading === "google" ? "Connecting..." : "Continue with Google"}
        </span>
      </button>

      {error && <div className="fp-social-auth-error">{error}</div>}

      <p className="fp-social-auth-legal">
        By continuing, you agree to FleetPilot&apos;s{" "}
        <a href="/terms" target="_blank" rel="noreferrer">Terms</a>
        {" "}and acknowledge the{" "}
        <a href="/privacy" target="_blank" rel="noreferrer">Privacy Policy</a>.
      </p>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M21.35 12.2c0-.72-.06-1.24-.2-1.79H12v3.37h5.37a4.6 4.6 0 0 1-1.99 3.02l-.02.11 2.89 2.24.2.02c1.84-1.7 2.9-4.2 2.9-6.97Z"
      />
      <path
        fill="#34A853"
        d="M12 21.75c2.63 0 4.84-.86 6.45-2.58l-3.07-2.37c-.82.55-1.9.94-3.38.94a5.87 5.87 0 0 1-5.55-4.06l-.11.01-3 2.32-.04.1A9.75 9.75 0 0 0 12 21.75Z"
      />
      <path
        fill="#FBBC05"
        d="M6.45 13.68A5.9 5.9 0 0 1 6.13 12c0-.58.11-1.14.3-1.68v-.12L3.4 7.84l-.1.05A9.72 9.72 0 0 0 2.25 12c0 1.47.38 2.86 1.05 4.1l3.15-2.42Z"
      />
      <path
        fill="#EA4335"
        d="M12 6.26c1.83 0 3.07.79 3.78 1.44l2.73-2.66C16.83 3.48 14.63 2.25 12 2.25a9.75 9.75 0 0 0-8.7 5.64l3.13 2.43A5.89 5.89 0 0 1 12 6.26Z"
      />
    </svg>
  );
}
