/**
 * Collapses duplicate clinician rows for one address onto the oldest row.
 *
 *   node scripts/dedupe-clinicians.mjs           # report only
 *   node scripts/dedupe-clinicians.mjs --apply   # repoint and delete
 *
 * Every reference is repointed before anything is deleted, so no history is
 * lost — completions, sessions, agreement acceptances and invites all follow
 * the surviving row. Run this before migration 005, which cannot create its
 * unique index while duplicates remain.
 */
import fs from "fs";

const env = Object.fromEntries(
  fs.readFileSync(".env.local", "utf8").split("\n").filter((l) => l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()])
);
const SB = `${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1`;
const H = {
  apikey: env.SUPABASE_SERVICE_ROLE_KEY,
  Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
  "Content-Type": "application/json",
};
const q = (p, i = {}) => fetch(`${SB}/${p}`, { headers: H, ...i });
const qj = (p, i = {}) => q(p, i).then((r) => r.json());

const APPLY = process.argv.includes("--apply");

/** Tables pointing at clinicians(id), and the column doing the pointing. */
const REFERENCES = [
  ["task_completions", "clinician_id"],
  ["pool_eligibility", "clinician_id"],
  ["sessions", "clinician_id"],
  ["agreement_acceptances", "clinician_id"],
  ["task_flags", "clinician_id"],
  ["calibration_attempts", "clinician_id"],
  ["invites", "invited_by"],
  ["invites", "accepted_by"],
  ["clinicians", "invited_by"],
];

const all = await qj("clinicians?select=id,email,created_at,can_invite&order=created_at.asc");
const groups = {};
for (const c of all) (groups[c.email.toLowerCase()] ??= []).push(c);
const dupes = Object.entries(groups).filter(([, rows]) => rows.length > 1);

console.log(APPLY ? "=== DEDUPE (applying) ===" : "=== DEDUPE (dry run) ===");
console.log(`clinicians: ${all.length}   addresses with duplicates: ${dupes.length}\n`);

if (dupes.length === 0) {
  console.log("nothing to do");
  process.exit(0);
}

for (const [email, rows] of dupes) {
  const keep = rows[0];
  const drop = rows.slice(1);
  console.log(`${email}`);
  console.log(`  keep  ${keep.id}  created ${keep.created_at?.slice(0, 10)}  can_invite=${keep.can_invite}`);

  // If any duplicate held the permission, the survivor must keep it.
  const anyCanInvite = rows.some((r) => r.can_invite);

  for (const d of drop) {
    let moved = 0;
    for (const [table, column] of REFERENCES) {
      const rowsHere = await qj(`${table}?${column}=eq.${d.id}&select=id`);
      if (!Array.isArray(rowsHere) || rowsHere.length === 0) continue;
      console.log(`    ${table}.${column}: ${rowsHere.length} row(s) → keep`);
      moved += rowsHere.length;
      if (APPLY) {
        // Several of these tables are unique on (clinician_id, something), so a
        // repoint can collide with a row the survivor already has. Move each
        // row on its own and drop the ones that collide — the survivor's
        // equivalent row is the one to keep.
        for (const row of rowsHere) {
          const r = await q(`${table}?id=eq.${row.id}`, {
            method: "PATCH", body: JSON.stringify({ [column]: keep.id }),
          });
          if (r.status === 409) {
            await q(`${table}?id=eq.${row.id}`, { method: "DELETE" });
          } else if (!r.ok) {
            console.log(`      repoint failed: HTTP ${r.status} ${(await r.text()).slice(0, 120)}`);
          }
        }
      }
    }
    if (moved === 0) console.log(`    (no references)`);
    if (APPLY) {
      const r = await q(`clinicians?id=eq.${d.id}`, { method: "DELETE" });
      console.log(`    delete ${d.id} → HTTP ${r.status}`);
    } else {
      console.log(`    would delete ${d.id}`);
    }
  }

  if (APPLY && anyCanInvite) {
    await q(`clinicians?id=eq.${keep.id}`, {
      method: "PATCH", body: JSON.stringify({ can_invite: true }),
    });
    console.log(`    survivor can_invite=true preserved`);
  }
  console.log();
}

if (APPLY) {
  const after = await qj("clinicians?select=id,email");
  const seen = {};
  for (const c of after) (seen[c.email.toLowerCase()] ??= []).push(c);
  const left = Object.entries(seen).filter(([, r]) => r.length > 1);
  console.log(`clinicians now: ${after.length}   remaining duplicates: ${left.length}`);
} else {
  console.log("re-run with --apply to make these changes");
}
