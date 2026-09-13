# FleetPilot Web v1.4.0 — Real Pilot AI Backend

Pilot AI now uses a protected Next.js server API route and the OpenAI Responses API.

## Security model
- `OPENAI_API_KEY` is server-only.
- The browser never receives the API key.
- `/api/pilot/ask` verifies the authenticated Supabase user.
- Fleet data is read through the user's existing company-scoped Supabase RLS session.
- Pilot AI receives only the signed-in company's FleetPilot data.
- No Supabase service-role key is used.

## Pilot AI data context
The backend currently summarizes:
- loads and routes
- revenue and mileage
- expenses and expense categories
- reimbursements
- fuel spend and gallons
- truck performance
- maintenance and upcoming service
- active weekly fixed expenses
- company fee settings
- recent odometer records

## Required local environment variable
Add to `.env.local`:

OPENAI_API_KEY=your_openai_api_key

Optional:

OPENAI_MODEL=gpt-5.6-luna

The model defaults to `gpt-5.6-luna` when `OPENAI_MODEL` is not set.

## Vercel
Add the same `OPENAI_API_KEY` as a Vercel Environment Variable for Production.
Optionally add `OPENAI_MODEL`.

Then redeploy.

## Validation
Run:

npm run typecheck
npm run build

Then test:
- `/pilot-ai`
- ask about fuel
- ask which truck is most profitable
- ask for an expense summary
- ask which maintenance is due soon
- ask which routes are strongest

Important business decisions should still be reviewed by the user.
