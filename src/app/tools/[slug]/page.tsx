import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PublicLayout from "@/components/public-layout";
import FreeTools from "../free-tools";
import {
  TOOL_DEFINITIONS,
  toolDefinitionFromSlug,
} from "@/lib/free-tools";
import { publicPageMetadata } from "@/lib/seo";

type ToolRouteProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return TOOL_DEFINITIONS.map((tool) => ({ slug: tool.slug }));
}

export async function generateMetadata({
  params,
}: ToolRouteProps): Promise<Metadata> {
  const { slug } = await params;
  const tool = toolDefinitionFromSlug(slug);

  if (!tool) {
    return publicPageMetadata({
      title: "Free Trucking Calculator",
      description:
        "Use MileVoxa free trucking calculators for cost, profit, fuel, and rate-per-mile decisions.",
      path: `/tools/${slug}`,
      noIndex: true,
    });
  }

  return publicPageMetadata({
    title: tool.metaTitle,
    description: tool.metaDescription,
    path: `/tools/${tool.slug}`,
  });
}

export default async function ToolCalculatorPage({
  params,
}: ToolRouteProps) {
  const { slug } = await params;
  const tool = toolDefinitionFromSlug(slug);

  if (!tool) notFound();

  return (
    <PublicLayout mainClassName="mv-tools-page fp-marketing min-h-screen bg-[#f7f9fc] text-[#0b1730]">
      <section className="fp-tools-public-hero fp-tools-route-hero">
        <span>FREE TRUCKING CALCULATOR</span>
        <h1>{tool.title}</h1>
        <p>{tool.metaDescription}</p>
      </section>

      <section className="fp-tools-public-section">
        <FreeTools initialActive={tool.key} navigationMode="routes" />
      </section>

      <section className="fp-tools-public-bottom">
        <span>ALL FREE CALCULATORS</span>
        <h2>Run another number before you make the decision.</h2>
        <p>
          Switch calculators above or return to the full MileVoxa tools overview.
        </p>
        <Link href="/tools">View All Free Tools →</Link>
      </section>
    </PublicLayout>
  );
}
