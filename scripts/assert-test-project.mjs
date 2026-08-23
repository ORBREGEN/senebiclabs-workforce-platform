/**
 * Refuses to let a test touch a Label Studio project that has a webhook.
 *
 * A webhook on a project means something downstream — the HEALTH backend —
 * consumes every annotation written to it. Importing tasks or submitting
 * answers there during a test delivers junk into that system, and no amount of
 * cleaning up in Label Studio afterwards retracts what the webhook already
 * sent. So the check happens before the write, not after.
 *
 * Usage from any test script:
 *
 *   import { assertTestProject } from "./scripts/assert-test-project.mjs";
 *   await assertTestProject(38);   // throws unless the project is webhook-free
 *
 * Or from the shell:
 *
 *   node scripts/assert-test-project.mjs 38
 */

import fs from "fs";

function loadEnv() {
  return Object.fromEntries(
    fs
      .readFileSync(".env.local", "utf8")
      .split("\n")
      .filter((l) => l.includes("="))
      .map((l) => [
        l.slice(0, l.indexOf("=")).trim(),
        l.slice(l.indexOf("=") + 1).trim(),
      ])
  );
}

export async function assertTestProject(projectId) {
  const env = loadEnv();
  const res = await fetch(
    `${env.LABEL_STUDIO_API_URL}/api/webhooks/?project=${projectId}`,
    { headers: { Authorization: `Token ${env.LABEL_STUDIO_API_TOKEN}` } }
  );

  if (!res.ok) {
    throw new Error(
      `Cannot verify project ${projectId} is safe for testing (webhooks lookup returned ${res.status}). Refusing to proceed.`
    );
  }

  const body = await res.json();
  const hooks = Array.isArray(body) ? body : (body?.results ?? []);

  if (hooks.length > 0) {
    const urls = hooks.map((h) => h.url).join(", ");
    throw new Error(
      `REFUSING TO TEST against Label Studio project ${projectId}: it has ${hooks.length} webhook(s) — ${urls}\n` +
        `Anything written there is delivered downstream and cannot be retracted.\n` +
        `Use a webhook-free project for tests.`
    );
  }

  return true;
}

// Direct invocation: node scripts/assert-test-project.mjs <projectId>
if (import.meta.url === `file://${process.argv[1]}`) {
  const id = process.argv[2];
  if (!id) {
    console.error("usage: node scripts/assert-test-project.mjs <projectId>");
    process.exit(2);
  }
  try {
    await assertTestProject(Number(id));
    console.log(`project ${id}: no webhooks — safe to test against`);
  } catch (err) {
    console.error(String(err.message ?? err));
    process.exit(1);
  }
}
