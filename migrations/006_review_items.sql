-- Author → reviewer flow for written work.
--
-- Categorical answers can be settled by consensus: three clinicians pick from
-- the same list and the majority is the answer. Prose cannot. Two well-written
-- responses to the same prompt are not votes to be counted, and merging them
-- produces text neither clinician would sign. So written work is authored once
-- and then approved once, and the approved text is delivered verbatim.
--
-- A project opts in with eval_config.review_required = true.
--
-- Draft text is held here and never written to Label Studio. LS holds approved
-- values only, so a project's webhook cannot deliver unapproved prose
-- downstream — an annotation appears there when a reviewer approves, not when
-- an author submits.
--
-- Run this against the project database before enabling review_required.

create table if not exists review_items (
  id            uuid primary key default gen_random_uuid(),
  pool_id       uuid not null references pools(id) on delete cascade,
  ls_task_id    integer not null,

  state         text not null default 'needs_author'
                  check (state in ('needs_author','needs_review','approved','rejected')),

  -- Authoring
  author_id     uuid null references clinicians(id) on delete set null,
  authored_at   timestamptz,
  authored_data jsonb,

  -- Review
  reviewer_id   uuid null references clinicians(id) on delete set null,
  reviewed_at   timestamptz,
  review_action text null check (review_action in ('approved','edited','rejected')),
  reject_reason text,

  -- The single delivered value. Never a merge: either the authored text or the
  -- reviewer's edit of it.
  final_data    jsonb,
  ls_annotation_id integer,

  -- How many times this item has been sent back, so a loop is visible.
  revision      integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  unique (pool_id, ls_task_id)
);

create index if not exists idx_review_items_state on review_items (pool_id, state);
create index if not exists idx_review_items_author on review_items (author_id);

alter table review_items enable row level security;
-- Reached only through the service role in the API layer; no direct client access.

comment on table review_items is
  'Two-phase state for written work: authored once, approved once. Author and reviewer are always different clinicians, enforced in the serving layer.';
