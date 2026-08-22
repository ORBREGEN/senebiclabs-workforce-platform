-- Test pool with ALL field types + instructions + hints
-- This uses real LS project 38 ("All Field Types — TEST") with exact dict-shaped eval_config

INSERT INTO pools (name, ls_project_id, calibration_items, eval_config, maximum_annotations, created_at)
VALUES (
  'All field types — test',
  38,
  jsonb_build_array(
    jsonb_build_object(
      'question', 'Review the model output: Is it accurate against standard guidelines?',
      'options', jsonb_build_array('Yes, accurate', 'No, has errors', 'Partial accuracy'),
      'correct_option', 'Yes, accurate'
    ),
    jsonb_build_object(
      'question', 'Classify this case using the provided categories.',
      'options', jsonb_build_array('Acute', 'Chronic', 'Routine'),
      'correct_option', 'Acute'
    )
  ),
  jsonb_build_object(
    'title', 'All field types — test',
    'purpose', 'evaluate',
    'instructions', 'TEST RUBRIC: Review the model''s answer against standard guidelines.
Mark the verdict, classify the case, rate your confidence, and flag any critical finding.
If unsure, use your judgment and note the concern.',
    'schema', jsonb_build_object(
      'input', 'text',
      'context', jsonb_build_array(
        jsonb_build_object('key', 'scenario', 'label', 'Clinical scenario'),
        jsonb_build_object('key', 'prediction', 'label', 'Model output')
      ),
      'classes', jsonb_build_array('Acute', 'Chronic', 'Routine'),
      'case_id_field', 'case_id',
      'fields', jsonb_build_object(
        'verdict', jsonb_build_object(
          'type', 'single',
          'options', jsonb_build_array('Accurate', 'Has errors', 'Partial'),
          'required', true,
          'hint', 'Assess against standard protocols.'
        ),
        'classification', jsonb_build_object(
          'type', 'from_classes',
          'hint', 'Choose the most specific category.'
        ),
        'rationale', jsonb_build_object(
          'type', 'text',
          'hint', 'Why did you choose this? Any concerns?'
        ),
        'confidence', jsonb_build_object(
          'type', 'scale',
          'max', 5,
          'hint', '1 = low confidence, 5 = very confident.'
        ),
        'critical_finding', jsonb_build_object(
          'type', 'structured',
          'hint', 'First: is there a finding? Then: what type?'
        )
      )
    )
  ),
  3,
  NOW()
);

-- Ensure test clinician is eligible for this pool
-- First, create or get test clinician
DELETE FROM clinicians WHERE email = 'test@example.com';

INSERT INTO clinicians (email, name, access_code)
VALUES ('test@example.com', 'Test Clinician', 'TEST0001');

-- Then mark as eligible for the test-all-fields pool
DELETE FROM pool_eligibility
WHERE clinician_id = (SELECT id FROM clinicians WHERE email = 'test@example.com')
  AND pool_id = (SELECT id FROM pools WHERE name = 'All field types — test');

INSERT INTO pool_eligibility (clinician_id, pool_id, eligible, created_at)
SELECT c.id, p.id, true, NOW()
FROM clinicians c, pools p
WHERE c.email = 'test@example.com' AND p.name = 'All field types — test';

-- Verify the config — fields should be DICT-shaped
SELECT
  p.id as pool_id,
  p.name,
  p.ls_project_id,
  (p.eval_config ->> 'title') as title,
  (p.eval_config ->> 'instructions') as instructions_preview,
  jsonb_object_keys(p.eval_config -> 'schema' -> 'fields') as field_names
FROM pools p
WHERE p.name = 'All field types — test';
