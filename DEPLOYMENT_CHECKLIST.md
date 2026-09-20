# MileVoxa Web — Production Deployment Checklist

## 1. Environment
Set these in Vercel Project Settings → Environment Variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` or your project's publishable key

Never expose the Supabase service-role key to the browser.

## 2. Supabase security
Confirm:
- RLS enabled on business tables.
- Company-scoped authenticated policies remain active.
- No broad anonymous development policies exist.
- `current_company_id()` works for authenticated users.

## 3. Documents
If not already completed, run:

`supabase_documents_setup.sql`

Then test:
- upload
- open signed document
- delete
- one company cannot see another company's files

## 4. Local pre-deployment checks

```powershell
npm install
npm run typecheck
npm run build
npm run dev
```

Check `/health` returns HTTP 200 and:
- `"ok": true`
- `"supabaseConfigured": true`

## 5. Functional smoke test
Test with the same account used by the mobile app:
- Login / sign out
- Dashboard week navigation
- Loads CRUD
- Trucks add/status
- Expenses add/delete
- Reimbursements
- Maintenance
- Weekly Settlement
- Fuel Analytics
- Reports PDF/CSV export
- Documents
- Pilot AI insights
- Settings profile update/password reset

## 6. Responsive smoke test
Test approximately:
- 1440px desktop
- 1024px tablet
- 768px tablet portrait
- 390px phone

Verify that tables scroll inside their cards and do not expand the whole page horizontally.

## 7. Vercel
Deploy from the GitHub repository using the project root.

After deployment:
- open `/health`
- log in
- compare Dashboard and Weekly Settlement with the mobile app
- test one write operation
- test Documents private-file access

## 8. Before public launch
Still recommended:
- real subscription/billing
- production Pilot AI API/backend
- privacy policy and terms
- account deletion workflow
- monitoring/error reporting
- backups and recovery plan
