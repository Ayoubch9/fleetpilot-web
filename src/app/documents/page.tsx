import AppShell from "@/components/app-shell";
import { getFleetPilotAccount } from "@/lib/fleetpilot-account";
import DocumentManager from "./document-manager";
import DocumentCenter from "./document-center";

type DocumentRow = {
  id: string;
  name: string;
  document_type: string | null;
  truck_id: string | null;
  expiration_date: string | null;
  storage_path: string;
  file_name: string;
  created_at: string | null;
};

type Truck = { id: string; unit_number: string };

export default async function DocumentsPage() {
  const { supabase, fullName, companyName, role } = await getFleetPilotAccount();

  const { data: membership } = await supabase
    .from("company_members")
    .select("company_id")
    .eq("user_id", (await supabase.auth.getUser()).data.user?.id)
    .maybeSingle();

  const [{ data: truckData }, documentResult] = await Promise.all([
    supabase.from("trucks").select("id, unit_number").order("unit_number"),
    supabase
      .from("documents")
      .select("id, name, document_type, truck_id, expiration_date, storage_path, file_name, created_at")
      .order("created_at", { ascending: false }),
  ]);

  const trucks = (truckData ?? []) as Truck[];
  const docs = (documentResult.data ?? []) as DocumentRow[];
  const today = new Date();
  const soon = new Date(today.getTime() + 30 * 86400000);

  const expiring = docs.filter((doc) => {
    if (!doc.expiration_date) return false;
    const date = new Date(`${doc.expiration_date}T12:00:00`);
    return date >= today && date <= soon;
  });

  const expired = docs.filter((doc) => {
    if (!doc.expiration_date) return false;
    return new Date(`${doc.expiration_date}T12:00:00`) < today;
  });

  const typeCounts = new Map<string, number>();
  for (const doc of docs) {
    const key = doc.document_type || "Other";
    typeCounts.set(key, (typeCounts.get(key) || 0) + 1);
  }

  const setupMissing = Boolean(
    documentResult.error &&
      /relation .*documents.* does not exist|could not find the table|schema cache/i.test(
        documentResult.error.message
      )
  );

  return (
    <AppShell active="documents" fullName={fullName} companyName={companyName} role={role}>
      <div className="fp-tool-page">
        <div className="fp-tool-heading">
          <div>
            <h1>Documents</h1>
            <p>Store and manage important documents for your trucks and business.</p>
          </div>
          {membership?.company_id && !setupMissing ? (
            <DocumentManager companyId={membership.company_id} trucks={trucks} />
          ) : (
            <button className="fp-primary-btn" disabled>＋ Upload Document</button>
          )}
        </div>

        {setupMissing && (
          <div className="fp-doc-setup-notice">
            Documents is ready in the web app, but the Supabase documents table and private storage bucket still need to be created.
            Run <b>supabase_documents_setup.sql</b> once in the Supabase SQL Editor.
          </div>
        )}

        <div className="fp-doc-layout">
          <DocumentCenter docs={docs} trucks={trucks} setupMissing={setupMissing} />

          <aside className="fp-right-stack">
            <section className="fp-panel side">
              <h2>Quick Actions</h2>
              <Action text="Upload Document"/>
              <Action text="Create Folder"/>
              <Action text="Import from File"/>
              <Action text="View Expiring"/>
            </section>

            <section className="fp-panel side">
              <h2>Documents by Type</h2>
              <div className="fp-empty-donut"><strong>{docs.length}</strong><span>Total Documents</span></div>
              <div className="fp-doc-type-list">
                {[...typeCounts.entries()].slice(0, 7).map(([name, count]) => (
                  <p key={name}><span>{name}</span><b>{count}</b></p>
                ))}
                {docs.length === 0 && <p className="fp-muted-center">No document types yet.</p>}
              </div>
            </section>

            <Promo text={"Stay Compliant.\nKeep Moving."}/>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}

function Action({text}:{text:string}){return <button className="fp-side-action">▣ <span>{text}</span><b>›</b></button>}
function Promo({text}:{text:string}){return <div className="fp-tool-promo"><div>{text.split("\n").map((x,i)=><div key={i}>{x}</div>)}</div></div>}
