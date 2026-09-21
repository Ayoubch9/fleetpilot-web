import Link from "next/link";

export default function PublicFooter() {
  return (
    <footer className="fp-public-footer">
      <div className="fp-marketing-footer fp-public-footer-inner">
        <Link href="/" className="fp-marketing-brand" aria-label="MileVoxa home">
          <img
            src="/branding/milevoxa-logo-full.png"
            width={2000}
            height={612}
            className="mv-marketing-logo"
            alt="MileVoxa — Run your trucking business with clarity."
          />
        </Link>

        <div aria-label="Footer navigation">
          <Link href="/#features">Features</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/#about">About</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/data-deletion">Data Deletion</Link>
          <Link href="/contact">Contact</Link>
          <Link href="/login">Sign In</Link>
        </div>

        <span>© 2026 MileVoxa</span>
      </div>
    </footer>
  );
}
