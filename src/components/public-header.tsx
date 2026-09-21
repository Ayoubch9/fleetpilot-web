import Link from "next/link";

export default function PublicHeader() {
  return (
    <header className="fp-marketing-header fp-public-header">
      <Link href="/" className="fp-marketing-brand" aria-label="MileVoxa home">
        <img
          src="/branding/milevoxa-logo-full.png"
          width={2000}
          height={612}
          className="mv-marketing-logo"
          alt="MileVoxa — Run your trucking business with clarity."
        />
      </Link>

      <nav className="fp-marketing-nav" aria-label="Public navigation">
        <Link href="/#features">Features</Link>
        <Link href="/tools">Free Tools</Link>
        <Link href="/pricing">Pricing</Link>
        <Link href="/#about">About</Link>
      </nav>

      <div className="fp-marketing-header-actions">
        <Link href="/login" className="fp-marketing-button secondary">
          Sign In
        </Link>
        <Link href="/signup" className="fp-marketing-button primary">
          Start Free
        </Link>
      </div>
    </header>
  );
}
