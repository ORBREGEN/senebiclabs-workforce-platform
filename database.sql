-- Create clinicians table
create table if not exists clinicians (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  created_at timestamp default now()
);

-- Create pools table (maps to Label Studio projects)
create table if not exists pools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  ls_project_id integer not null,
  calibration_items jsonb not null,
  passing_threshold numeric default 0.8,
  created_at timestamp default now()
);

-- Create pool eligibility table (the confidentiality gate)
create table if not exists pool_eligibility (
  id uuid primary key default gen_random_uuid(),
  clinician_id uuid not null references clinicians(id) on delete cascade,
  pool_id uuid not null references pools(id) on delete cascade,
  eligible boolean default false,
  eligible_since timestamp,
  created_at timestamp default now(),
  unique(clinician_id, pool_id)
);

-- Create calibration attempts table
create table if not exists calibration_attempts (
  id uuid primary key default gen_random_uuid(),
  clinician_id uuid not null references clinicians(id) on delete cascade,
  pool_id uuid not null references pools(id) on delete cascade,
  score numeric not null,
  passed boolean not null,
  attempted_at timestamp default now()
);

-- Create task completions table (audit trail)
create table if not exists task_completions (
  id uuid primary key default gen_random_uuid(),
  clinician_id uuid not null references clinicians(id) on delete cascade,
  pool_id uuid not null references pools(id) on delete cascade,
  ls_task_id integer not null,
  annotation_data jsonb,
  completed_at timestamp default now()
);

-- Create sessions table (for magic link auth)
create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  clinician_id uuid not null references clinicians(id) on delete cascade,
  token text unique not null,
  expires_at timestamp not null,
  created_at timestamp default now()
);

-- Enable RLS (Row Level Security) for confidentiality
alter table clinicians enable row level security;
alter table pools enable row level security;
alter table pool_eligibility enable row level security;
alter table calibration_attempts enable row level security;
alter table task_completions enable row level security;
alter table sessions enable row level security;

-- RLS Policy: clinicians can only see their own data
create policy "clinicians_see_self" on clinicians
  for select using (auth.uid()::text = id::text);

-- RLS Policy: pools are readable by everyone (public list)
create policy "pools_readable" on pools
  for select using (true);

-- RLS Policy: can only see eligibility for own pools
create policy "eligibility_see_own" on pool_eligibility
  for select using (clinician_id::text = auth.uid()::text);

-- RLS Policy: can only see own task completions
create policy "task_completions_see_own" on task_completions
  for select using (clinician_id::text = auth.uid()::text);

-- Create indexes for performance
create index if not exists idx_pool_eligibility_clinician on pool_eligibility(clinician_id);
create index if not exists idx_pool_eligibility_pool on pool_eligibility(pool_id);
create index if not exists idx_task_completions_clinician_pool on task_completions(clinician_id, pool_id);
create index if not exists idx_task_completions_ls_task on task_completions(ls_task_id);
