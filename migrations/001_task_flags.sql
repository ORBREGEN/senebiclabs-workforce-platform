-- Flagging: a clinician marks a case they cannot judge and is never served it
-- again. No annotation is written to Label Studio for a flagged case, so a
-- flag never becomes a guess in the data.
--
-- Run this against the project database before enabling flagging.

create table if not exists task_flags (
  id uuid primary key default gen_random_uuid(),
  clinician_id uuid not null references clinicians(id) on delete cascade,
  pool_id uuid not null references pools(id) on delete cascade,
  ls_task_id integer not null,
  reason text default '',
  flagged_at timestamp default now(),
  unique (clinician_id, ls_task_id)
);

create index if not exists idx_task_flags_clinician_pool
  on task_flags (clinician_id, pool_id);

alter table task_flags enable row level security;

-- Reads go through the service role in the API layer; no direct client access.
create policy "task_flags_own_rows" on task_flags
  for select using (clinician_id::text = auth.uid()::text);

-- Idempotent submissions depend on this pair being unique.
create unique index if not exists idx_task_completions_clinician_task
  on task_completions (clinician_id, ls_task_id);
