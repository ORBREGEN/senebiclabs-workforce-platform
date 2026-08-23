import fs from "fs";
const env=Object.fromEntries(fs.readFileSync(".env.local","utf8").split("\n").filter(l=>l.includes("="))
  .map(l=>[l.slice(0,l.indexOf("=")).trim(),l.slice(l.indexOf("=")+1).trim()]));
const APP="http://localhost:3000";
const SBH={apikey:env.SUPABASE_SERVICE_ROLE_KEY,Authorization:`Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,"Content-Type":"application/json"};
const SB=(p)=>fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/${p}`,{headers:SBH}).then(r=>r.json());
const LSH={Authorization:`Token ${env.LABEL_STUDIO_API_TOKEN}`,"Content-Type":"application/json"};

async function allTasks(){
  const out=[];
  for(let p=1;p<=50;p++){
    const r=await fetch(`${env.LABEL_STUDIO_API_URL}/api/projects/38/tasks/?page=${p}&page_size=200`,{headers:LSH});
    const j=await r.json();
    const rows=Array.isArray(j)?j:(j.tasks??[]);
    out.push(...rows);
    if(rows.length<200) break;
  }
  return out;
}
const [pool]=await SB("pools?ls_project_id=eq.38&select=id,maximum_annotations");

console.log("=== PAGINATION: does serving now see the whole project? ===");
const tasks=await allTasks();
const proj=await(await fetch(`${env.LABEL_STUDIO_API_URL}/api/projects/38/`,{headers:LSH})).json();
console.log(`  project task_number: ${proj.task_number}   paginated fetch: ${tasks.length}   match: ${proj.task_number===tasks.length}`);

console.log();
console.log("=== TRUE DIVERGENCE (counted over every page) ===");
const lsAnn=tasks.reduce((n,t)=>n+(t.annotations?.length??0),0);
const db=(await SB(`task_completions?pool_id=eq.${pool.id}&select=id`)).length;
console.log(`  LS annotations: ${lsAnn}   DB completions: ${db}   equal: ${lsAnn===db}`);

console.log();
console.log(`=== EXISTING OVERLAP BREACHES (ceiling ${pool.maximum_annotations}) ===`);
const over=tasks.filter(t=>(t.annotations?.length??0)>pool.maximum_annotations);
console.log(`  tasks over the ceiling: ${over.length}`);
if(over.length) console.log(`  e.g. ${over.slice(0,5).map(t=>`task ${t.id}: ${t.annotations.length}`).join(", ")}`);

console.log();
console.log("=== CEILING RE-CHECK UNDER A LIVE RACE (fresh case) ===");
const seed=Array.from({length:3},(_,i)=>({data:{case_id:`CEIL-${Date.now()}-${i}`,scenario:"Ceiling probe.",prediction:"Out."}}));
await fetch(`${env.LABEL_STUDIO_API_URL}/api/projects/38/import`,{method:"POST",headers:LSH,body:JSON.stringify(seed)});

const emails=["reviewer.one@example.com","reviewer.two@example.com","reviewer.three@example.com","test@example.com"];
async function session(email){
  const j=await(await fetch(`${APP}/api/auth/magic-link`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email})})).json();
  const r=await fetch(`${APP}/api/auth/verify`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token:j.magicLink.split("token=")[1]})});
  return (r.headers.get("set-cookie")??"").split(";")[0];
}
const cookies=await Promise.all(emails.map(session));
const probeRes=await fetch(`${APP}/api/pools/${pool.id}/next`,{headers:{Cookie:cookies[0]}});
if(probeRes.status===204){ console.log("  pool drained; cannot race"); process.exit(0); }
const probe=await probeRes.json();
console.log(`  ${cookies.length} clinicians race task ${probe.task_id} (case ${probe.case_id})`);
const answers={verdict:"Accurate",classification:"Acute",confidence:3,rationale:"Ceiling race.",critical_finding:"No"};
const res=await Promise.all(cookies.map(ck=>fetch(`${APP}/api/tasks/${probe.task_id}/submit`,
  {method:"POST",headers:{Cookie:ck,"Content-Type":"application/json"},body:JSON.stringify({answers})})));
console.log(`  statuses: ${res.map(r=>r.status).join(", ")}`);
const after=await(await fetch(`${env.LABEL_STUDIO_API_URL}/api/tasks/${probe.task_id}/`,{headers:LSH})).json();
const dbRows=(await SB(`task_completions?ls_task_id=eq.${probe.task_id}&select=id`)).length;
console.log(`  LS annotations on that task: ${after.annotations.length}   DB rows: ${dbRows}`);
console.log(`  ceiling respected (<= ${pool.maximum_annotations}): ${after.annotations.length<=pool.maximum_annotations}`);
console.log(`  LS == DB for that task: ${after.annotations.length===dbRows}`);
