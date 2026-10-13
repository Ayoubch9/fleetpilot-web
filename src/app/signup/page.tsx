"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import SocialAuthButtons from "@/components/social-auth-buttons";
import { trackEvent } from "@/lib/analytics";
import { BUSINESS_ROLES } from "@/lib/business-roles";
import styles from "./signup-redesign.module.css";

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyNameEdited, setCompanyNameEdited] = useState(false);
  const [businessRole, setBusinessRole] = useState("");
  const [dotNumber, setDotNumber] = useState("");
  const [mcNumber, setMcNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!termsAccepted) {
      setError("Please agree to the Terms and Privacy Policy to continue.");
      return;
    }

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
          business_role: businessRole,
          dot_number: dotNumber.trim(),
          mc_number: mcNumber.trim(),
          profile_setup_required: true,
        },
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    trackEvent("sign_up", {
      method: "email",
    });

    if (data.session) {
      router.push("/onboarding");
      router.refresh();
      return;
    }

    router.push("/login");
  }

  return (
    <main className={`${styles.page} mv-signup-page`}>
      <header className={styles.mobileHeader}>
        <Link href="/" className={styles.mobileBrand} aria-label="MileVoxa home">
          <Image unoptimized width={2000} height={445}
            src="/branding/milevoxa-logo-horizontal.png"
            alt="MileVoxa"
          />
        </Link>
        <Link href="/login" className={styles.mobileSignin}>
          Sign In Instead
        </Link>
      </header>

      <div className={styles.split}>
        <section className={styles.brandPanel}>
          <div className={styles.ambientGlow} aria-hidden="true" />

          <div className={styles.brandTop}>
            <Link href="/" className={styles.darkBrand} aria-label="MileVoxa home">
              <Image unoptimized width={2499} height={556}
                src="/branding/milevoxa-logo-full-dark.png"
                alt="MileVoxa — Run your trucking business with clarity."
              />
            </Link>

            <div className={styles.story}>
              <div className={styles.storyBadge}>
                <span />
                ZERO RISK • NO CARD REQUIRED
              </div>

              <div className={styles.storyHeadline}>
                Run your numbers on actual freight,
                <span>not guesses.</span>
              </div>

              <p>
                Create your account in under 2 minutes. Get instant access to
                Pilot AI, live deadhead profit scoring, and weekly settlement
                tracking without bloated software fees.
              </p>
            </div>
          </div>

          <div className={styles.featuresCard}>
            <span className={styles.featuresLabel}>Included In Your Account</span>

            <div className={styles.featureRow}>
              <span>✓</span>
              <p><strong>Load Decision Center:</strong> Evaluate rate, deadhead drag, and true CPM before booking.</p>
            </div>
            <div className={styles.featureRow}>
              <span>✓</span>
              <p><strong>Weekly Settlements:</strong> Know your net operating result after fuel, fixed costs, and fees.</p>
            </div>
            <div className={styles.featureRow}>
              <span>✓</span>
              <p><strong>Pilot AI Co-Dispatcher:</strong> Natural language queries over your fleet numbers.</p>
            </div>
            <div className={styles.featureRow}>
              <span>✓</span>
              <p><strong>Web + Mobile Account:</strong> Keep data synced between the dispatch desk and the sleeper cab.</p>
            </div>
          </div>

          <div className={styles.brandProof}>
            <span><b>✓</b> 100% Free in Beta</span>
            <span><b>✓</b> No Credit Card</span>
            <span><b>✓</b> 30-Day Notice Before Paid Tiers</span>
          </div>
        </section>

        <section className={styles.signupPanel}>
          <div className={styles.desktopSignin}>
            <span>Already have an account?</span>
            <Link href="/login">Sign In</Link>
          </div>

          <div className={styles.formShell}>
            <div className={styles.formIntro}>
              <div className={styles.portalBadge}>
                <span />
                STEP 1 OF 2 • INSTANT SETUP
              </div>
              <h1>Join the Free Beta</h1>
              <p>Free during beta. No credit card required.</p>
            </div>

            <form onSubmit={submit} className={styles.form}>
              <div className={styles.twoColumnFields}>
                <label className={styles.field}>
                  <span>Your Name</span>
                  <input
                    required
                    type="text"
                    value={fullName}
                    onChange={(event) => {
                      const value = event.target.value;
                      setFullName(value);
                      if (!companyNameEdited) {
                        const clean = value.trim();
                        setCompanyName(clean ? `${clean} Trucking` : "");
                      }
                    }}
                    placeholder="John Doe"
                    autoComplete="name"
                  />
                </label>

                <label className={styles.field}>
                  <span>Company Name (optional)</span>
                  <input
                    required={false}
                    type="text"
                    value={companyName}
                    onChange={(event) => {
                      setCompanyNameEdited(true);
                      setCompanyName(event.target.value);
                    }}
                    placeholder={
                      fullName.trim()
                        ? `${fullName.trim()} Trucking`
                        : "My Trucking Business"
                    }
                    autoComplete="organization"
                  />
                </label>
              </div>

              <div className={styles.twoColumnFields}>
                <label className={styles.field}>
                  <span>Your Role</span>
                  <select
                    required
                    value={businessRole}
                    onChange={(event) => setBusinessRole(event.target.value)}
                    autoComplete="organization-title"
                  >
                    <option value="" disabled>Select your role</option>
                    {BUSINESS_ROLES.map((role) => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </label>
                <label className={styles.field}>
                  <span>USDOT Number <small>(optional)</small></span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={dotNumber}
                    onChange={(event) => setDotNumber(event.target.value)}
                    placeholder="USDOT number"
                    autoComplete="off"
                  />
                </label>
              </div>

              <label className={styles.field}>
                <span>MC Number <small>(optional)</small></span>
                <input
                  type="text"
                  value={mcNumber}
                  onChange={(event) => setMcNumber(event.target.value)}
                  placeholder="MC number"
                  autoComplete="off"
                />
              </label>

              <label className={styles.field}>
                <span>Work or Dispatch Email</span>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="carrier@fleet.com"
                  autoComplete="email"
                />
              </label>

              <label className={styles.field}>
                <span>Password</span>
                <div className={styles.passwordWrap}>
                  <input
                    required
                    minLength={8}
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? "HIDE" : "SHOW"}
                  </button>
                </div>
              </label>

              <label className={styles.terms}>
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(event) => setTermsAccepted(event.target.checked)}
                />
                <span>
                  I agree to the{" "}
                  <Link href="/terms" target="_blank">Terms</Link>
                  {" "}and{" "}
                  <Link href="/privacy" target="_blank">Privacy Policy</Link>.
                </span>
              </label>

              {error && (
                <div className={styles.error} role="alert">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={styles.submit}
              >
                <span>{loading ? "Creating account..." : "Create Free Account"}</span>
                {!loading && <span>→</span>}
              </button>
            </form>

            <div className={styles.oauthDivider}>
              <span>or continue with</span>
            </div>

            <div className={styles.googleAuth}>
              <SocialAuthButtons />
            </div>

            <div className={styles.zeroRiskDivider}>
              <span>Zero Risk Promise</span>
            </div>

            <div className={styles.toolsPrompt}>
              <p>Want to test without an account first?</p>
              <Link href="/tools">Use our Free Trucking Calculators →</Link>
            </div>
          </div>

          <footer className={styles.footer}>
            <span>© 2026 MileVoxa</span>
            <nav aria-label="Signup footer navigation">
              <Link href="/privacy">Privacy</Link>
              <Link href="/terms">Terms</Link>
              <Link href="/pricing">Pricing &amp; Beta</Link>
              <Link href="/about">About</Link>
              <Link href="/tools">Free Tools</Link>
              <Link href="/data-deletion">Data Deletion</Link>
              <Link href="/contact">Contact</Link>
            </nav>
          </footer>
        </section>
      </div>
    </main>
  );
}
