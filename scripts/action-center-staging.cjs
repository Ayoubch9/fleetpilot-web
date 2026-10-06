/* eslint-disable @typescript-eslint/no-require-imports */
// Isolated Supabase branch only. Does not run migrations or change production.
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const {createClient} = require("@supabase/supabase-js");
const LIVE_REF = "dntnmzeoybianhzwufpz";
const ref = process.env.ACTION_CENTER_STAGING_REF || "";
const url = process.env.ACTION_CENTER_STAGING_URL || "";
assert.match(ref,/^[a-z]{20}$/,"A verified staging project reference is required.");
assert.notEqual(ref,LIVE_REF,"Production is explicitly prohibited.");
assert.equal(new URL(url).hostname,`${ref}.supabase.co`,"Staging URL must match the verified branch.");
assert.equal(process.env.ACTION_CENTER_STAGING_CONFIRMED,"1","Confirm the isolated branch before test writes.");
const anon = process.env.ACTION_CENTER_STAGING_ANON_KEY;
const adminKey = process.env.ACTION_CENTER_STAGING_SERVICE_KEY;
assert.ok(anon && adminKey,"Staging-only API credentials are required.");
const statePath = process.env.ACTION_CENTER_STAGING_STATE_FILE;
assert.ok(statePath,"A temporary file for staging-only fixture IDs is required.");
const admin = createClient(url,adminKey,{auth:{persistSession:false,autoRefreshToken:false}});
const tables = ["trucks","maintenance_records","documents","expenses","reimbursements","weekly_odometer_records"];
async function result(query) {
  const response = await query;
  if (response.error) throw new Error(`${response.error.code || "Supabase"}: ${response.error.message}`);
  return response.data;
}
const iso = date=>date.toISOString().slice(0,10);
const days = (today,offset)=>iso(new Date(Date.parse(`${today}T12:00:00Z`)+offset*86400000));
function state() {
  const data=JSON.parse(fs.readFileSync(statePath,"utf8"));
  assert.equal(data.ref,ref,"Fixture state must belong to this staging branch.");
  return data;
}
async function signIn(user) {
  const client=createClient(url,anon,{auth:{persistSession:false,autoRefreshToken:false}});
  await result(client.auth.signInWithPassword({email:user.email,password:user.password}));
  return client;
}
async function seed() {
  // Refuse any branch containing pre-existing business records. This must be
  // an empty schema-only clone, not a copy of production data.
  for (const table of [...tables,"companies"]) {
    const response=await admin.from(table).select("id",{count:"exact",head:true});
    if (response.error) throw new Error(`Could not verify empty staging source: ${table}`);
    assert.equal(response.count,0,`Staging ${table} must be empty before seeding.`);
  }
  const fixture={ref,today:iso(new Date()),users:[],companyA:crypto.randomUUID(),companyB:crypto.randomUUID(),truckA:crypto.randomUUID(),truckB:crypto.randomUUID(),maintenance:crypto.randomUUID(),document:crypto.randomUUID(),expense:crypto.randomUUID(),fuel:crypto.randomUUID(),odometer:crypto.randomUUID()};
  for (const name of ["owner","peer","other-company"]) {
    const user={email:`action-center-${name}@staging.example.invalid`,password:`StagingOnly-${crypto.randomBytes(18).toString("hex")}!`};
    const data=await result(admin.auth.admin.createUser({...user,email_confirm:true,user_metadata:{full_name:`Action Center Test ${name}`}}));
    user.id=data.user.id;
    fixture.users.push(user);
    fs.writeFileSync(statePath,JSON.stringify(fixture),{mode:0o600});
  }
  await result(admin.from("companies").insert([
    {id:fixture.companyA,name:"Action Center staging A",owner_user_id:fixture.users[0].id,timezone:"UTC"},
    {id:fixture.companyB,name:"Action Center staging B",owner_user_id:fixture.users[2].id,timezone:"UTC"},
  ]));
  await result(admin.from("company_members").insert([
    {company_id:fixture.companyA,user_id:fixture.users[0].id,role:"owner"},
    {company_id:fixture.companyA,user_id:fixture.users[1].id,role:"manager"},
    {company_id:fixture.companyB,user_id:fixture.users[2].id,role:"owner"},
  ]));
  await result(admin.from("trucks").insert([
    {id:fixture.truckA,company_id:fixture.companyA,unit_number:"STAGE-A-102",current_mileage:10624,status:"ACTIVE"},
    {id:fixture.truckB,company_id:fixture.companyB,unit_number:"STAGE-B-204",current_mileage:20000,status:"ACTIVE"},
  ]));
  await result(admin.from("maintenance_records").insert({id:fixture.maintenance,company_id:fixture.companyA,truck_id:fixture.truckA,service_type:"Staging oil service",service_date:days(fixture.today,-30),mileage:9000,cost:0,next_service_date:days(fixture.today,-2),next_service_mileage:10000}));
  await result(admin.from("documents").insert({id:fixture.document,company_id:fixture.companyA,uploaded_by:fixture.users[0].id,name:"Staging insurance",document_type:"Insurance",truck_id:fixture.truckA,expiration_date:days(fixture.today,12),storage_path:`${fixture.companyA}/staging-insurance.txt`,file_name:"staging-insurance.txt",mime_type:"text/plain"}));
  const purchases=Array.from({length:12},(_,i)=>({id:crypto.randomUUID(),company_id:fixture.companyA,truck_id:fixture.truckA,category:"Tolls",expense_date:days(fixture.today,-80+i*4),amount:50}));
  purchases.push({id:fixture.expense,company_id:fixture.companyA,truck_id:fixture.truckA,category:"Tolls",expense_date:fixture.today,amount:1000});
  await result(admin.from("expenses").insert(purchases));
  const fuelPurchases=Array.from({length:12},(_,i)=>({id:crypto.randomUUID(),company_id:fixture.companyA,truck_id:fixture.truckA,category:"Fuel",expense_date:days(fixture.today,-80+i*4),amount:300,gallons:100,fuel_price_per_gallon:3}));
  fuelPurchases.push({id:fixture.fuel,company_id:fixture.companyA,truck_id:fixture.truckA,category:"Fuel",expense_date:fixture.today,amount:600,gallons:100,fuel_price_per_gallon:6});
  await result(admin.from("expenses").insert(fuelPurchases));
  const week=new Date(`${fixture.today}T12:00:00Z`);
  week.setUTCDate(week.getUTCDate()-(week.getUTCDay()+6)%7-14);
  fixture.week=iso(week);
  await result(admin.from("weekly_odometer_records").insert({id:fixture.odometer,company_id:fixture.companyA,truck_id:fixture.truckA,week_start:fixture.week,start_odometer:10624,end_odometer:10000,rate_per_mile:0.15,notes:"Isolated staging-only incomplete reading"}));
  const bucket=await admin.storage.createBucket("documents",{public:false});
  if (bucket.error && !/already exists/i.test(bucket.error.message)) throw new Error(bucket.error.message);
  await result(admin.storage.from("documents").upload(`${fixture.companyA}/staging-insurance.txt`,Buffer.from("Isolated Action Center test document. No production information."),{contentType:"text/plain",upsert:true}));
  fs.writeFileSync(statePath,JSON.stringify(fixture),{mode:0o600});
  console.log("Created isolated staging fixtures: two companies, three users, five maintenance/document/expense/fuel/settlement conditions. No production data copied.");
}
async function checkIsolation() {
  const fixture=state();
  const clients=await Promise.all(fixture.users.map(signIn));
  for (let i=0;i<clients.length;i++) {
    const expected=i===2?fixture.companyB:fixture.companyA;
    assert.equal(await result(clients[i].rpc("current_company_id")),expected);
    for (const table of tables) {
      const rows=await result(clients[i].from(table).select("company_id"));
      assert.ok(rows.every(row=>row.company_id===expected),`${table}: signed-in tenant isolation failed`);
    }
  }
  const key=`maintenance:${fixture.maintenance}`;
  await result(clients[0].from("action_center_interactions").upsert({company_id:fixture.companyA,user_id:fixture.users[0].id,alert_key:key,source:"maintenance",truck_id:fixture.truckA,fingerprint:"critical:staging-rls-test",action:"acknowledge"},{onConflict:"company_id,user_id,alert_key"}));
  assert.equal((await result(clients[0].from("action_center_interactions").select("alert_key"))).length,1);
  assert.equal((await result(clients[1].from("action_center_interactions").select("alert_key"))).length,0,"Same-company users must not see each other's interaction state.");
  assert.equal((await result(clients[2].from("action_center_interactions").select("alert_key"))).length,0,"Cross-company interactions must not be visible.");
  const forged=await clients[2].from("action_center_interactions").insert({company_id:fixture.companyA,user_id:fixture.users[2].id,alert_key:"documents:forged-company",source:"documents",fingerprint:"warning:test",action:"acknowledge"});
  assert.ok(forged.error,"Cross-company writes must be rejected.");
  const forgedUser=await clients[1].from("action_center_interactions").insert({company_id:fixture.companyA,user_id:fixture.users[0].id,alert_key:"documents:forged-user",source:"documents",fingerprint:"warning:test",action:"acknowledge"});
  assert.ok(forgedUser.error,"Other-user writes must be rejected.");
  const update=await result(clients[2].from("action_center_interactions").update({action:"dismiss"}).eq("alert_key",key).select("alert_key"));
  assert.equal(update.length,0,"Cross-company UPDATE must not affect rows.");
  const deleted=await result(clients[2].from("action_center_interactions").delete().eq("alert_key",key).select("alert_key"));
  assert.equal(deleted.length,0,"Cross-company DELETE must not affect rows.");
  await result(clients[0].from("action_center_interactions").delete().eq("alert_key",key));
  console.log("PASS: signed-in source isolation and interaction SELECT/INSERT/UPDATE/DELETE isolation across companies and same-company users.");
}
async function resolve() {
  const fixture=state();
  await result(admin.from("maintenance_records").update({next_service_date:days(fixture.today,90),next_service_mileage:30000}).eq("company_id",fixture.companyA).eq("id",fixture.maintenance));
  await result(admin.from("documents").update({expiration_date:days(fixture.today,90)}).eq("company_id",fixture.companyA).eq("id",fixture.document));
  await result(admin.from("expenses").update({amount:50}).eq("company_id",fixture.companyA).eq("id",fixture.expense));
  await result(admin.from("expenses").update({amount:300,fuel_price_per_gallon:3}).eq("company_id",fixture.companyA).eq("id",fixture.fuel));
  await result(admin.from("weekly_odometer_records").update({end_odometer:10724}).eq("company_id",fixture.companyA).eq("id",fixture.odometer));
  console.log("Resolved the five known staging-only source conditions for zero-alert and automatic-resolution checks.");
}
const modes={seed,check:checkIsolation,resolve};
assert.ok(modes[process.argv[2]],"Use seed, check, or resolve.");
modes[process.argv[2]]().catch(error=>{console.error(error.message);process.exitCode=1;});
