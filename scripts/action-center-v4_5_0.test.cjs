const fs=require('fs');
function read(p){return fs.readFileSync(p,'utf8')}
const dashboard=read('src/app/dashboard/page.tsx');
const lib=read('src/lib/action-center.ts');
const page=read('src/app/action-center/page.tsx');
const sql=read('supabase_action_center_v4_5_0.sql');
const css=read('src/app/globals.css');
const checks=[
 ['dashboard card',dashboard.includes('ActionCenterCard')&&dashboard.includes('getActionCenterAlerts')],
 ['reuses existing alert engine',lib.includes('getMileVoxaAlerts')],
 ['critical remains visible',lib.includes('alert.severity === "critical"')],
 ['action route',page.includes('Action Center')&&page.includes('severity')],
 ['RLS enabled',sql.includes('enable row level security')&&sql.includes('current_company_id()')&&sql.includes('auth.uid()')],
 ['no business duplication table',!sql.includes('maintenance_record')&&!sql.includes('document_id')],
 ['responsive css',css.includes('MileVoxa Action Center v4.5.0')&&css.includes('@media(max-width:760px)')],
];
let failed=0; for(const [name,ok] of checks){console.log(`${ok?'PASS':'FAIL'} ${name}`);if(!ok)failed++} if(failed)process.exit(1);
