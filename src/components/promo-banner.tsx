import Link from "next/link";

export type PromoBannerCta = {
  label: string;
  href: string;
};

export default function PromoBanner({
  headline,
  subtext,
  cta,
}: {
  headline: string;
  subtext: string;
  cta: PromoBannerCta;
}) {
  return (
    <section className="mv-promo-banner" aria-label={headline}>
      <div className="mv-promo-banner-overlay" />
      <div className="mv-promo-banner-content">
        <h3>{headline}</h3>
        <p>{subtext}</p>
        <Link href={cta.href}>{cta.label}</Link>
      </div>
    </section>
  );
}
