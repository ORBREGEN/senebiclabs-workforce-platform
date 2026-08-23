-- Atomic overlap enforcement.
--
-- A pool commissions a fixed number of reviews per case (pools.maximum_annotations).
-- Enforcing that with a read-then-write in the API is a time-of-check/time-of-use
-- race: several clinicians can each read "2 of 3 taken" and all proceed, so a
-- case ends up with more reviews than the client commissioned and consensus is
-- computed over more reviewers than agreed.
--
-- This function makes the claim atomic. It takes a row-level lock on the pool,
-- counts the completions for the task, and inserts only if there is room —
-- all in one statement, so concurrent callers serialise behind the lock.
--
-- Returns:
--   'claimed'  the slot was taken and the completion row written
--   'full'     the case already has its full complement of reviews
--   'already'  this clinician has already reviewed this case
--
-- The API calls this instead of inserting directly. Until it exists the API
-- falls back to a non-atomic check, which can overshoot the ceiling under
-- concurrency.

create or replace function claim_task_slot(
  p_clinician_id uuid,
  p_pool_id uuid,
  p_ls_task_id integer,
  p_annotation_data jsonb
) returns text
language plpgsql
as $$
declare
  v_ceiling integer;
  v_taken   integer;
begin
  -- Serialise every claim against this pool.
  select maximum_annotations into v_ceiling
  from pools where id = p_pool_id
  for update;

  if not found then
    return 'full';
  end if;

  if exists (
    select 1 from task_completions
    where clinician_id = p_clinician_id and ls_task_id = p_ls_task_id
  ) then
    return 'already';
  end if;

  if v_ceiling is not null then
    select count(*) into v_taken
    from task_completions
    where ls_task_id = p_ls_task_id;

    if v_taken >= v_ceiling then
      return 'full';
    end if;
  end if;

  insert into task_completions (clinician_id, pool_id, ls_task_id, annotation_data)
  values (p_clinician_id, p_pool_id, p_ls_task_id, p_annotation_data);

  return 'claimed';
exception
  when unique_violation then
    return 'already';
end;
$$;

-- Called only by the service role from the API layer.
revoke all on function claim_task_slot(uuid, uuid, integer, jsonb) from public, anon, authenticated;
