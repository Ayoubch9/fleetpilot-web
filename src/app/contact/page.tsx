import PublicLayout from "@/components/public-layout";
import ContactForm from "./contact-form";
import {
  SUPPORT_EMAIL,
  SUPPORT_RESPONSE_TIME,
} from "@/lib/support";
import { publicPageMetadata } from "@/lib/seo";

export const metadata = publicPageMetadata({
  title: "Contact MileVoxa",
  description:
    "Contact MileVoxa support for account, billing, privacy, or product questions, with an expected response within 48 hours.",
  path: "/contact",
});

export default function ContactPage(){
  return (
    <PublicLayout mainClassName="fp-contact-page fp-marketing min-h-screen bg-[#f7f9fc] text-[#0b1730]">
      <section className="fp-contact-hero">
        <span>CONTACT MILEVOXA</span>
        <h1>How can we help?</h1>
        <p>
          Contact MileVoxa about your account, billing, privacy, or product questions.
        </p>
      </section>

      <section className="fp-contact-layout">
        <div className="fp-contact-info">
          <span>SUPPORT EMAIL</span>
          <strong>{SUPPORT_EMAIL}</strong>
          <p>
            Use this address for account, billing, privacy, or product support.
          </p>

          <span>EXPECTED RESPONSE TIME</span>
          <strong>{SUPPORT_RESPONSE_TIME}</strong>
          <p>
            We aim to respond to support inquiries within this timeframe.
          </p>
        </div>

        <ContactForm />
      </section>
    </PublicLayout>
  );
}
