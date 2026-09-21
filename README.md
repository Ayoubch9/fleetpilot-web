# MileVoxa Web v4.3.12 — Homepage Bottom Surface Fix

Built from v4.3.11, which itself was built directly from v4.3.9.
The discarded v4.3.10 changes remain excluded.

## Fix
The large light-gray strip below the homepage final CTA was caused by the final
CTA's bottom margin collapsing outside the white homepage `<main>` and exposing
the shared public-shell background.

The homepage now establishes its own formatting context with `display: flow-root`
and explicitly keeps its surface white. This preserves the existing CTA spacing
while making the entire gap above the shared footer white.

No CTA, footer, content, spacing value, or responsive layout was redesigned.

## Preserved
The v4.3.11 full-width white public-header fix remains included.
