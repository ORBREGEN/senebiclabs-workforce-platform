-- Invite-only access.
--
-- Nobody self-registers. An account exists only because someone with the
-- permission invited that specific address, so the invite is the record of who
-- vouched for whom. Both sign-in methods run through the same gate, and the
-- gate is the only thing that creates a clinician.
--
-- Run this against the project database before enabling invite-only auth.

create table if not exists invites (
  id            uuid primary key default gen_random_uuid(),
  token         text unique not null,
  invited_email text not null,
  invited_by    uuid null references clinicians(id) on delete set null,
  status        text not null default 'pending'
                  check (status in ('pending','accepted','expired','revoked')),
  created_at    timestamptz not null default now(),
  expires_at    timestamptz,
  accepted_by   uuid null references clinicians(id) on delete set null
);

create index if not exists idx_invites_token on invites (token);

-- Matching is case-insensitive: someone invited as A.Osei@x.org must be able to
-- sign in as a.osei@x.org.
create index if not exists idx_invites_email_lower on invites (lower(invited_email));

-- At most one live invite per address, so a second invite cannot be spent after
-- the first is accepted. Partial, so accepted/revoked history is kept intact.
create unique index if not exists idx_invites_one_pending
  on invites (lower(invited_email))
  where status = 'pending';

alter table invites enable row level security;
-- All access is through the service role in the API layer; no client reads.

alter table clinicians add column if not exists can_invite boolean not null default false;
alter table clinicians add column if not exists invited_by uuid null references clinicians(id) on delete set null;

-- The founder can invite. Everyone else is false by default, and stays false
-- until granted — the in-app invite UI is already built and simply hidden
-- until this flag flips, so enabling a member needs no deploy.
update clinicians set can_invite = true where lower(email) = 'godwinyampoi449@gmail.com';
