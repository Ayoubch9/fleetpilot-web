"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import SocialAuthButtons from "@/components/social-auth-buttons";
import MileVoxaBrand from "@/components/milevoxa-brand";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your MileVoxa control center."
    >
      <SocialAuthButtons />
      <div className="fp-auth-divider"><span>or continue with email</span></div>
      <form onSubmit={handleSubmit} className="space-y-5">
        <Field label="Email" type="email" value={email} set={setEmail} placeholder="you@example.com" />
        <Field label="Password" type="password" value={password} set={setPassword} placeholder="Your password" />
        <div className="-mt-2 text-right">
          <Link
            href="/forgot-password"
            className="text-[14px] font-bold text-[#16853B] hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        {error && <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-600">{error}</div>}
        <button disabled={loading} className="mv-auth-primary">
          {loading ? "Signing in..." : "Sign In →"}
        </button>
      </form>
      <div className="mt-6 text-center text-sm text-[#7b8da2]">
        New to MileVoxa? <Link href="/signup" className="font-black text-[#16853B]">Create account</Link>
      </div>
    </AuthLayout>
  );
}

function AuthLayout({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <main className="mv-login-page grid min-h-screen lg:grid-cols-[.92fr_1.08fr]">
      <section className="relative hidden overflow-hidden border-r border-[#102238] bg-[#102238] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <MileVoxaBrand onDark />
        <div>
          <div className="text-[10px] font-black uppercase tracking-[.2em] text-[#55b772]">Trucking business intelligence</div>
          <div className="mt-5 max-w-lg text-5xl font-black leading-[1.02] tracking-[-.05em]">
            Every mile. Every cost. <span className="text-[#55b772]">One clear business.</span>
          </div>
          <p className="mt-6 max-w-md leading-7 text-[#9fb0bf]">
            Open the same MileVoxa business account you use on mobile and manage your operation from a larger control center.
          </p>
        </div>
        <div className="text-xs font-bold text-[#8da0b2]">MileVoxa · Web + Mobile</div>
        <div className="absolute -right-32 top-1/3 h-96 w-96 rounded-full bg-[#16853B]/10 blur-[100px]" />
      </section>
      <section className="flex items-center justify-center bg-[#F7F9F8] px-5 py-10">
        <div className="w-full max-w-[430px]">
          <MileVoxaBrand showTagline={false} className="mb-10 justify-center lg:hidden" />
          <div className="mb-8">
            <div className="text-[10px] font-black uppercase tracking-[.18em] text-[#16853B]">MileVoxa Account</div>
            <h1 className="mt-3 text-4xl font-black tracking-[-.04em] text-[#102238]">{title}</h1>
            <p className="mt-3 text-sm leading-6 text-[#6d7f94]">{subtitle}</p>
          </div>
          <div className="fleet-card rounded-[28px] p-7 sm:p-8">{children}</div>
        </div>
      </section>
    </main>
  );
}

function Field({ label, type, value, set, placeholder }: { label: string; type: string; value: string; set: (value: string) => void; placeholder: string }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[10px] font-black uppercase tracking-[.12em] text-[#7b8da2]">{label}</span>
      <input required type={type} value={value} onChange={(event) => set(event.target.value)} placeholder={placeholder} className="mv-auth-input" />
    </label>
  );
}
