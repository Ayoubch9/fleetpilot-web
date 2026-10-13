"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import SocialAuthButtons from "@/components/social-auth-buttons";
import { trackEvent } from "@/lib/analytics";
import styles from "./login-redesign.module.css";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    trackEvent("login", {
      method: "email",
    });

    router.push(
      authData.user?.user_metadata?.profile_setup_required === true
        ? "/onboarding"
        : "/dashboard"
    );
    router.refresh();
  }

  return (
    <main className={`${styles.page} mv-login-page`}>
      <header className={styles.mobileHeader}>
        <Link href="/" className={styles.mobileBrand} aria-label="MileVoxa home">
          <Image unoptimized width={2000} height={445}
            src="/branding/milevoxa-logo-horizontal.png"
            alt="MileVoxa"
          />
        </Link>
        <Link href="/signup" className={styles.mobileJoin}>
          Join Free Beta
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
                BUILT FOR REAL CARRIERS
              </div>

              <div className={styles.storyHeadline}>
                You know your gross rate.
                <span>Now know what the truck banked.</span>
              </div>

              <p>
                Stop digging through crumpled fuel receipts, disjointed text
                messages, and spreadsheet formulas. Log in to review your live
                profit-per-mile, upcoming PM services, and weekly settlements
                in one place.
              </p>
            </div>
          </div>

          <div className={styles.previewCard}>
            <div className={styles.previewHead}>
              <div>
                <span className={styles.statusDot} />
                <strong>Weekly Settlement Preview</strong>
              </div>
              <span>Truck 01</span>
            </div>

            <div className={styles.previewMetrics}>
              <div>
                <small>Gross Booked</small>
                <strong>$7,850.00</strong>
              </div>
              <div>
                <small>Diesel &amp; Tolls</small>
                <strong>-$2,140.00</strong>
              </div>
              <div className={styles.netMetric}>
                <small>Operating Net</small>
                <strong>+$3,330.00</strong>
              </div>
            </div>

            <div className={styles.aiNote}>
              <span>⚡</span>
              <p>
                Pilot AI: &quot;Fuel burn was 6.8 MPG this week (+0.3 MPG
                improvement on Midwest lane).&quot;
              </p>
            </div>
          </div>

          <div className={styles.brandProof}>
            <span><b>✓</b> Web + Mobile Synced</span>
            <span><b>✓</b> Secure Account Access</span>
            <span><b>✓</b> Instant Cab Access</span>
          </div>
        </section>

        <section className={styles.loginPanel}>
          <div className={styles.desktopSignup}>
            <span>First time using MileVoxa?</span>
            <Link href="/signup">Join Free Public Beta</Link>
          </div>

          <div className={styles.formShell}>
            <div className={styles.formIntro}>
              <div className={styles.portalBadge}>
                <span />
                CARRIER PORTAL LOGIN
              </div>
              <h1>Access Your Business</h1>
              <p>
                Sign in to manage loads, fuel expenses, and live settlements.
              </p>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
              <label className={styles.field}>
                <span>Email Address</span>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="operator@fleet.com"
                  autoComplete="email"
                />
              </label>

              <label className={styles.field}>
                <div className={styles.passwordLabel}>
                  <span>Password</span>
                  <Link href="/forgot-password">Forgot password?</Link>
                </div>

                <div className={styles.passwordWrap}>
                  <input
                    required
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="••••••••••••"
                    autoComplete="current-password"
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

              <label className={styles.remember}>
                <input
                  type="checkbox"
                  checked={rememberDevice}
                  onChange={(event) => setRememberDevice(event.target.checked)}
                />
                <span>Remember this device</span>
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
                <span>{loading ? "Signing in..." : "Sign In to Dashboard"}</span>
                {!loading && <span>→</span>}
              </button>
            </form>

            <div className={styles.oauthDivider}>
              <span>or continue with</span>
            </div>

            <div className={styles.googleAuth}>
              <SocialAuthButtons />
            </div>

            <div className={styles.betaDivider}>
              <span>Public Beta Program</span>
            </div>

            <div className={styles.betaPrompt}>
              <p>Running 1–10 trucks and need real profit clarity?</p>
              <Link href="/signup">
                Create your Free Beta Account (No credit card) →
              </Link>
            </div>
          </div>

          <footer className={styles.footer}>
            <span>© 2026 MileVoxa</span>
            <nav aria-label="Login footer navigation">
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
