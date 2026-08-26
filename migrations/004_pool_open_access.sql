-- Per-pool access control.
--
-- "Direct access" must not mean access to everything. A pool is closed unless
-- someone deliberately opens it, so onboarding a new client cannot expose that
-- client's case material to the existing panel as a side effect.
--
-- This does not change who checks access — requireEligiblePool remains the only
-- authority, and access is still a row in pool_eligibility. It changes only
-- which pools an accepted invitation grants automatically.
--
-- Run this against the project database before deploying the change.

alter table pools add column if not exists open_access boolean not null default false;

comment on column pools.open_access is
  'When true, accepting an invitation grants eligibility for this pool. False (the default) means access must be granted deliberately, per clinician.';

-- Deliberately no pool is opened here. Opening one is a decision, made per pool:
--   update pools set open_access = true where id = '<pool id>';
--
-- In particular "Bulk2 — eval (HEALTH)" (Label Studio project 27) stays closed:
-- it carries HEALTH's production webhook, so every annotation written there is
-- delivered downstream.
