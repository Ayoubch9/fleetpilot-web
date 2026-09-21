import type { Metadata } from "next";
import PublicLayout from "@/components/public-layout";
import Link from "next/link";
import FreeTools from "./free-tools";
import { publicPageMetadata } from "@/lib/seo";

export const metadata: Metadata = publicPageMetadata({
  title: "Free Trucking Calculators",
  description:
    "Free trucking calculators for cost per mile, load profit, owner-operator profit, lease-operator take-home, fuel cost and rate per mile.",
  path: "/tools",
});

export default function ToolsPage() {
  return (
    <PublicLayout mainClassName="mv-tools-page fp-marketing min-h-screen bg-[#f7f9fc] text-[#0b1730]">
      

      <section className="fp-tools-public-hero">
        <span>FREE TOOLS FOR TRUCKERS</span>
        <h1>Know the number before you make the decision.</h1>
        <p>
          Free trucking calculators for owner-operators, lease operators,
          contractor drivers and small fleets. No login, no credit card,
          no spreadsheet required.
        </p>
      </section>

      <section className="fp-tools-public-section">
        <FreeTools />
      </section>

      <section className="fp-tools-public-bottom">
        <span>FROM CALCULATOR TO CONTROL CENTER</span>
        <h2>Stop re-entering the same numbers every week.</h2>
        <p>
          MileVoxa stores the loads, trucks, fuel, maintenance and expenses
          behind these calculations so profitability stays available whenever
          you need it.
        </p>
        <Link href="/signup">Start Your 14-Day Free Trial →</Link>
      </section>
    </PublicLayout>
  );
}

