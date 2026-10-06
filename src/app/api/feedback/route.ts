import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getMileVoxaAccessEntitlement } from "@/lib/beta-access";

export const dynamic = "force-dynamic";

const CATEGORIES = new Set([
  "Bug",
  "Suggestion",
  "Confusing experience",
  "Other",
]);

const FEEDBACK_KINDS = new Set(["general", "signout", "milestone"]);

const ALLOWED_TAGS = new Set([
  "Easy to use",
  "Saved me time",
  "Missing feature",
  "Something confusing",
  "Too many steps",
  "Bug / issue",
]);

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { data: membership } = await supabase
      .from("company_members")
      .select("company_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!membership?.company_id) {
      return NextResponse.json(
        { error: "No company is linked to this account." },
        { status: 403 }
      );
    }

    const entitlement = await getMileVoxaAccessEntitlement(
      supabase,
      membership.company_id,
      user.created_at
    );

    if (!entitlement.allowed) {
      return NextResponse.json(
        { error: "Your MileVoxa access is not active." },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => null);
    const category = String(body?.category || "").trim();
    const message = String(body?.message || "").trim();
    const pageContext = String(body?.pageContext || "").trim();
    const mayContact = body?.mayContact === true;

    const rawRating = Number(body?.rating || 0);
    const rating =
      Number.isInteger(rawRating) && rawRating >= 1 && rawRating <= 5
        ? rawRating
        : null;

    const tags = Array.isArray(body?.tags)
      ? body.tags
          .map((tag: unknown) => String(tag || "").trim())
          .filter((tag: string) => ALLOWED_TAGS.has(tag))
          .slice(0, 8)
      : [];

    const rawKind = String(body?.feedbackKind || "general").trim();
    const feedbackKind = FEEDBACK_KINDS.has(rawKind) ? rawKind : "general";

    const rawSessionSeconds = Number(body?.sessionSeconds);
    const sessionSeconds =
      Number.isFinite(rawSessionSeconds) && rawSessionSeconds >= 0
        ? Math.min(Math.round(rawSessionSeconds), 86400 * 7)
        : null;

    if (!CATEGORIES.has(category)) {
      return NextResponse.json(
        { error: "Choose a valid feedback category." },
        { status: 400 }
      );
    }

    if (message.length < 5 || message.length > 5000) {
      return NextResponse.json(
        { error: "Feedback must be between 5 and 5,000 characters." },
        { status: 400 }
      );
    }

    if (pageContext.length > 300) {
      return NextResponse.json(
        { error: "Page context must be 300 characters or fewer." },
        { status: 400 }
      );
    }

    if (body?.rating != null && rating == null) {
      return NextResponse.json(
        { error: "Rating must be a whole number from 1 to 5." },
        { status: 400 }
      );
    }

    const baseInsert = {
      user_id: user.id,
      company_id: membership.company_id,
      category,
      message,
      page_context: pageContext || null,
      may_contact: mayContact,
      source: "web",
    };

    // v4.6.6 structured beta fields. The fallback preserves compatibility if
    // the optional migration has not been applied yet.
    const structuredInsert = {
      ...baseInsert,
      rating,
      feedback_tags: tags,
      feedback_kind: feedbackKind,
      app_version: "web-4.6.6",
      session_seconds: sessionSeconds,
    };

    let { error } = await supabase.from("beta_feedback").insert(structuredInsert);

    if (error) {
      const schemaLooksOld =
        error.code === "PGRST204" ||
        error.code === "42703" ||
        /column|schema cache/i.test(error.message || "");

      if (schemaLooksOld) {
        const fallback = await supabase.from("beta_feedback").insert(baseInsert);
        error = fallback.error;
      }
    }

    if (error) {
      console.error("Beta feedback insert error:", error);
      return NextResponse.json(
        { error: "Could not submit feedback. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Thanks — your feedback was sent to the MileVoxa team.",
    });
  } catch (error) {
    console.error("Beta feedback route error:", error);
    return NextResponse.json(
      { error: "Could not submit feedback. Please try again." },
      { status: 500 }
    );
  }
}
