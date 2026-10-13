const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const read = (file) => fs.readFileSync(path.join(process.cwd(), file), "utf8");
const helper = read("src/lib/load-stops.ts");
const editor = read("src/app/loads/load-stops-editor.tsx");
const create = read("src/app/loads/add-load-form.tsx");
const edit = read("src/app/loads/load-actions.tsx");
const detail = read("src/app/loads/[id]/page.tsx");
const migration = read("supabase_load_stops_setup.sql");

assert.match(helper, /getLoadStops\([\s\S]*?legacy-pickup[\s\S]*?legacy-delivery/);
assert.match(helper, /stops\[0\]\.kind !== "PICKUP"/);
assert.match(helper, /stops\[stops\.length - 1\]\.kind !== "DELIVERY"/);
assert.match(helper, /up to 20 stops/);
assert.match(editor, /Add stop/);
assert.match(editor, /Move stop/);
assert.match(editor, /Appointment date/);
assert.match(editor, /Handling instructions/);
assert.doesNotMatch(editor, /Appointment time|Time status|type="time"|Anytime \/ 24 hours/);
assert.match(create, /route_stops: effectiveStops/);
assert.match(edit, /route_stops: routeStops/);
assert.match(detail, /routeStops\.map\(\(stop, index\)/);
assert.match(migration, /add column if not exists route_stops jsonb not null default '\[\]'::jsonb/i);
assert.match(migration, /jsonb_array_length\(route_stops\) between 2 and 20/);
assert.match(migration, /sync_load_route_stop_endpoints/);
assert.match(migration, /before insert or update on public\.loads/i);
assert.match(migration, /new\.route_stops is not distinct from old\.route_stops/i);
assert.match(migration, /new\.route_stops is distinct from old\.route_stops/i);
assert.match(migration, /preserve them/i);
assert.doesNotMatch(migration, /create policy|disable row level security|drop policy/i);

console.log("PASS multi-stop route contract, legacy fallback, and RLS-preserving schema contract");
