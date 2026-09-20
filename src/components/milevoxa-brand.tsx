import Link from "next/link";

type BrandProps = {
  href?: string;
  onDark?: boolean;
  showTagline?: boolean;
  compact?: boolean;
  className?: string;
};

export function MileVoxaMark({
  className = "",
  onDark = false,
}: {
  className?: string;
  onDark?: boolean;
}) {
  return (
    <img
      src={
        onDark
          ? "/branding/milevoxa-logo-mark-white.png"
          : "/branding/milevoxa-logo-mark.png"
      }
      width={1024}
      height={1024}
      className={`mv-brand-mark ${className}`}
      alt=""
      aria-hidden="true"
    />
  );
}

export default function MileVoxaBrand({
  href = "/",
  onDark = false,
  showTagline = true,
  compact = false,
  className = "",
}: BrandProps) {
  const src = showTagline
    ? onDark
      ? "/branding/milevoxa-logo-full-dark.png"
      : "/branding/milevoxa-logo-full.png"
    : onDark
      ? "/branding/milevoxa-logo-horizontal-dark.png"
      : "/branding/milevoxa-logo-horizontal.png";

  return (
    <Link
      href={href}
      className={`mv-brand ${compact ? "compact" : ""} ${className}`}
      aria-label="MileVoxa home"
    >
      <img
        src={src}
        width={2000}
        height={showTagline ? 612 : 445}
        className="mv-brand-lockup"
        alt="MileVoxa — Run your trucking business with clarity."
      />
    </Link>
  );
}
