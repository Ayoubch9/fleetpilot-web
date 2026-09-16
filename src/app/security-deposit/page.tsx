import AppShell from "@/components/app-shell";
import { getFleetPilotAccount } from "@/lib/fleetpilot-account";
import SecurityDepositManager, {
  type DepositSettings,
  type DepositTransaction,
} from "./security-deposit-manager";

export default async function SecurityDepositPage() {
  const {
    supabase,
    user,
    fullName,
    companyName,
    role,
  } = await getFleetPilotAccount();

  const { data: membership } = await supabase
    .from("company_members")
    .select("company_id, role")
    .eq("user_id", user.id)
    .maybeSingle();

  const companyId = membership?.company_id || "";
  const owner =
    (membership?.role || role || "").toLowerCase() === "owner";

  const [settingsResult, transactionsResult, trucksResult] =
    companyId
      ? await Promise.all([
          supabase
            .from("security_deposit_settings")
            .select(
              "id, company_id, target_amount, hold_method, weekly_amount, start_date, expected_release_date, status, notes"
            )
            .eq("company_id", companyId)
            .maybeSingle(),
          supabase
            .from("security_deposit_transactions")
            .select(
              "id, company_id, truck_id, transaction_date, transaction_type, adjustment_direction, amount, description, reference, notes, created_at"
            )
            .eq("company_id", companyId)
            .order("transaction_date", { ascending: false })
            .order("created_at", { ascending: false }),
          supabase
            .from("trucks")
            .select("id, unit_number, status")
            .eq("company_id", companyId)
            .order("unit_number"),
        ])
      : [
          { data: null, error: null },
          { data: [], error: null },
          { data: [], error: null },
        ];

  const missingStorage = [
    settingsResult.error,
    transactionsResult.error,
  ].some((error) =>
    error
      ? /security_deposit_|could not find the table|relation .* does not exist|schema cache/i.test(
          error.message
        )
      : false
  );

  const storageReady = !missingStorage;

  const initialSettings = settingsResult.data
    ? ({
        ...settingsResult.data,
        target_amount: Number(
          settingsResult.data.target_amount || 0
        ),
        weekly_amount: Number(
          settingsResult.data.weekly_amount || 0
        ),
      } as DepositSettings)
    : null;

  const initialTransactions = (
    transactionsResult.data || []
  ).map((row) => ({
    ...row,
    amount: Number(row.amount || 0),
  })) as DepositTransaction[];

  const trucks = (trucksResult.data || [])
    .filter(
      (truck) =>
        (truck.status || "ACTIVE").toUpperCase() !== "INACTIVE"
    )
    .map((truck) => ({
      id: truck.id,
      unit_number: truck.unit_number,
    }));

  return (
    <AppShell
      active="deposit"
      fullName={fullName}
      companyName={companyName}
      role={role}
    >
      <div className="fp-deposit-page">
        <section className="fp-deposit-heading">
          <div>
            <h1>Security Deposit</h1>
            <p>
              Track money the company is holding, repayments received and the
              balance they still owe you.
            </p>
          </div>
        </section>

        <SecurityDepositManager
          companyId={companyId}
          initialSettings={initialSettings}
          initialTransactions={initialTransactions}
          trucks={trucks}
          owner={owner}
          storageReady={storageReady}
        />
      </div>
    </AppShell>
  );
}
