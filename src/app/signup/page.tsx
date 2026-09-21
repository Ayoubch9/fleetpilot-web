"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import SocialAuthButtons from "@/components/social-auth-buttons";
import MileVoxaBrand from "@/components/milevoxa-brand";

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyNameEdited, setCompanyNameEdited] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const normalizedName = fullName.trim();
    const resolvedCompanyName =
      companyName.trim() ||
      (normalizedName ? `${normalizedName} Trucking` : "My Trucking Business");

    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: normalizedName,
          company_name: resolvedCompanyName,
        },
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (data.session) {
      router.push("/dashboard");
      router.refresh();
      return;
    }

    router.push("/login");
  }

  return (
    <main className="mv-signup-page grid min-h-screen lg:grid-cols-[.92fr_1.08fr]">
      <section className="relative hidden overflow-hidden border-r border-[#102238] bg-[#102238] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <MileVoxaBrand onDark />
        <div>
          <div className="text-[10px] font-black uppercase tracking-[.2em] text-[#55b772]">Start your control center</div>
          <div className="mt-5 max-w-lg text-5xl font-black leading-[1.02] tracking-[-.05em]">
            Run the truck like a <span className="text-[#55b772]">business.</span>
          </div>
          <p className="mt-6 max-w-md leading-7 text-[#9fb0bf]">
            Create one account for your loads, costs, fleet, maintenance and weekly profit — shared across MileVoxa web and mobile.
          </p>
        </div>
        <div className="text-xs font-bold text-[#8da0b2]">14-day trial · No card required</div>
        <div className="mt-1 text-[11px] font-[600] text-[#16853B]">Plans from $19/month per company.</div>
        <div className="absolute -right-32 top-1/3 h-96 w-96 rounded-full bg-[#16853B]/10 blur-[100px]" />
      </section>

      <section className="flex items-center justify-center bg-[#F7F9F8] px-5 py-10">
        <div className="w-full max-w-[450px]">
          <MileVoxaBrand showTagline={false} className="mb-10 justify-center lg:hidden" />
          <div className="mb-8">
            <div className="text-[10px] font-black uppercase tracking-[.18em] text-[#16853B]">Create MileVoxa Account</div>
            <h1 className="mt-3 text-4xl font-black tracking-[-.04em] text-[#102238]">Start free</h1>
            <p className="mt-3 text-sm text-[#6d7f94]">Use the same account later on mobile and web.</p>
          </div>

          <div className="fleet-card rounded-[28px] p-7 sm:p-8">
            <SocialAuthButtons />
            <div className="fp-auth-divider"><span>or create account with email</span></div>
            <form onSubmit={submit} className="space-y-5">
              <Field
                label="Your name"
                value={fullName}
                set={(value) => {
                  setFullName(value);
                  if (!companyNameEdited) {
                    const clean = value.trim();
                    setCompanyName(clean ? `${clean} Trucking` : "");
                  }
                }}
                placeholder="Full name"
              />
              <Field
                label="Company name (optional)"
                value={companyName}
                set={(value) => {
                  setCompanyNameEdited(true);
                  setCompanyName(value);
                }}
                placeholder={
                  fullName.trim()
                    ? `${fullName.trim()} Trucking`
                    : "My Trucking Business"
                }
                required={false}
              />
              <Field label="Email" type="email" value={email} set={setEmail} placeholder="you@example.com" />
              <Field label="Password" type="password" value={password} set={setPassword} placeholder="Create a password" />
              {error && <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-600">{error}</div>}
              <button disabled={loading} className="mv-auth-primary">
                {loading ? "Creating account..." : "Create Account →"}
              </button>
              <div className="fp-email-signup-legal">
                By creating an account, you agree to <Link href="/terms" target="_blank">Terms</Link> and acknowledge the <Link href="/privacy" target="_blank">Privacy Policy</Link>.
              </div>
              <div className="text-center text-sm text-[#7b8da2]">
                Already have MileVoxa? <Link href="/login" className="font-black text-[#16853B]">Sign in</Link>
              </div>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}

function Field({
  label,
  type = "text",
  value,
  set,
  placeholder,
  required = true,
}: {
  label: string;
  type?: string;
  value: string;
  set: (value: string) => void;
  placeholder: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[10px] font-black uppercase tracking-[.12em] text-[#7b8da2]">{label}</span>
      <input required={required} type={type} value={value} onChange={(event) => set(event.target.value)} placeholder={placeholder} className="mv-auth-input" />
    </label>
  );
}
