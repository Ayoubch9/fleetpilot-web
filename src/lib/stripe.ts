export async function stripeRequest(
  path: string,
  body?: URLSearchParams
) {
  const key = process.env.STRIPE_SECRET_KEY;

  if (!key) {
    throw new Error("Stripe is not configured. Add STRIPE_SECRET_KEY.");
  }

  const response = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: body ? "POST" : "GET",
    headers: {
      Authorization: `Bearer ${key}`,
      ...(body
        ? { "Content-Type": "application/x-www-form-urlencoded" }
        : {}),
    },
    body: body?.toString(),
    cache: "no-store",
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(
      payload?.error?.message || `Stripe request failed (${response.status}).`
    );
  }

  return payload;
}
