import Image from "next/image";
import Link from "next/link";
import homeStyles from "../home-redesign.module.css";

export function ToolsAnnouncement() {
  return (
    <div className={homeStyles.betaStrip}>
      <div className={homeStyles.containerRow}>
        <span className={homeStyles.betaBadge}>PUBLIC BETA</span>
        <span>MileVoxa is free during our open public beta.</span>
        <span className={homeStyles.betaDot}>•</span>
        <span className={homeStyles.hideMobile}>No credit card required.</span>
        <Link href="/tools" className={homeStyles.inlineGreenLink}>
          Run the Free Calculators ↓
        </Link>
      </div>
    </div>
  );
}

export function ToolsHeader() {
  return (
    <header className={homeStyles.header}>
      <div className={homeStyles.headerInner}>
        <Link href="/" className={homeStyles.brand} aria-label="MileVoxa home">
          <Image unoptimized width={2499} height={556}
            src="/branding/milevoxa-logo-full-dark.png"
            alt="MileVoxa — Run your trucking business with clarity."
            className={homeStyles.headerLogo}
          />
        </Link>

        <nav className={homeStyles.nav} aria-label="MileVoxa navigation">
          <Link href="/#how-it-works">How It Works</Link>
          <Link href="/#pilot-ai">Pilot AI</Link>
          <Link href="/#action-center">Action Center</Link>
          <Link href="/tools" className={homeStyles.navMuted}>
            Free Tools ↗
          </Link>
        </nav>

        <div className={homeStyles.headerActions}>
          <Link href="/login" className={homeStyles.signInLink}>
            Sign In
          </Link>
          <Link href="/signup" className={homeStyles.primaryButtonSmall}>
            Join the Free Beta
          </Link>
        </div>
      </div>
    </header>
  );
}

export function ToolsFooter() {
  return (
    <footer className={homeStyles.footer}>
      <div className={homeStyles.footerInner}>
        <Link href="/" className={homeStyles.footerBrand} aria-label="MileVoxa home">
          <Image unoptimized width={2499} height={556}
            src="/branding/milevoxa-logo-full-dark.png"
            alt="MileVoxa — Run your trucking business with clarity."
            className={homeStyles.footerLogo}
          />
        </Link>

        <nav aria-label="Footer navigation">
          <Link href="/">Main Platform</Link>
          <Link href="/tools">Free Tools</Link>
          <Link href="/pricing">Pricing &amp; Beta</Link>
          <Link href="/about">About</Link>
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/terms">Terms of Service</Link>
          <Link href="/data-deletion">Data Deletion</Link>
          <Link href="/contact">Contact Team</Link>
        </nav>

        <span>© 2026 MileVoxa</span>
      </div>
    </footer>
  );
}
