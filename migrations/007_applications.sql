-- Applications from clinicians who want to join.
--
-- The platform is invite-only, so the landing page cannot create accounts. It
-- collects an application, which an operator reviews before deciding whether to
-- send an invite. Nothing here grants access: an application is a request, and
-- the invite remains the only way in.
--
-- Run this before the landing page's apply form can accept submissions.

create table if not exists applications (
  id          uuid primary key default gen_random_uuid(),
  full_name   text not null,
  email       text not null,
  specialty   text not null,
  credential  text not null,
  country     text not null,

  status      text not null default 'new'
                check (status in ('new','reviewing','invited','declined')),
  notes       text,

  created_at  timestamptz not null default now(),
  reviewed_at timestamptz
);

create index if not exists idx_applications_status on applications (status, created_at desc);
create index if not exists idx_applications_email on applications (lower(email));

alter table applications enable row level security;
-- Written by the public apply endpoint through the service role, read only by
-- the operator console. No client-side access.

comment on table applications is
  'Requests to join from the public landing page. Reviewed by an operator, who sends an invite if approved. An application never grants access by itself.';
