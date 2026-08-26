-- One account per address.
--
-- Three rows existed for the founder's address, which made the sign-in lookup
-- error; the gate read that as "not a member" and refused a real clinician for
-- want of an invite. The gate now tolerates duplicates, but they should not
-- arise in the first place.
--
-- Run scripts/dedupe-clinicians.mjs BEFORE this: the index cannot be created
-- while duplicates remain.

create unique index if not exists idx_clinicians_email_lower
  on clinicians (lower(email));
