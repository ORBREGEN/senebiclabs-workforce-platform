-- Production-grade seed data for testing
-- This creates a complete test pool with eval_config, calibration, and sample tasks

-- 1. Create a test pool with professional eval_config
INSERT INTO pools (name, ls_project_id, calibration_items, eval_config, maximum_annotations, created_at)
VALUES (
  'Clinical Triage Assessment',
  14,
  jsonb_build_array(
    jsonb_build_object(
      'question', 'A 72-year-old with hypertension presents with mild headache. BP 145/90. Which triage is most appropriate?',
      'options', jsonb_build_array('Emergent — immediate physician evaluation', 'Urgent — evaluate within 30 min', 'Routine — standard scheduling', 'Observation only'),
      'correct_option', 'Routine — standard scheduling'
    ),
    jsonb_build_object(
      'question', 'A 34-year-old with no significant history reports chest discomfort with exertion. Which triage is most appropriate?',
      'options', jsonb_build_array('Emergent — immediate evaluation', 'Urgent — evaluate within 30 min', 'Routine — standard scheduling', 'Home monitoring'),
      'correct_option', 'Emergent — immediate evaluation'
    )
  ),
  jsonb_build_object(
    'instructions',
    'Judge the clinical triage decision against current medical guidelines and best practices. Look for:
• Clinical appropriateness: Does the recommended action align with the patient state?
• Safety: Are there any contraindications or risks?
• Documentation: Is the clinical reasoning clear and complete?

Mark as "Has errors" only for clinically material issues (not style or minor formatting). If the case is unclear or outside your expertise, flag it for review rather than guessing.

Typical cases take 3–5 minutes. Work at your own pace; no timer.',
    'schema', jsonb_build_object(
      'fields', jsonb_build_object(
        'verdict', jsonb_build_object(
          'type', 'single',
          'title', 'Is this clinical decision correct?',
          'hint', 'Assess against guidelines. Flag if unclear.',
          'options', jsonb_build_array('Correct — appropriate for patient state', 'Has errors — clinically material issues', 'Unclear — flag for senior review'),
          'required', true
        ),
        'rationale', jsonb_build_object(
          'type', 'text',
          'title', 'Explain your assessment (optional but valuable)',
          'hint', 'What did you evaluate? Any specific concerns?',
          'rows', 4,
          'required', false
        )
      ),
      'context', jsonb_build_array(
        jsonb_build_object(
          'label', 'Patient Case',
          'content', 'Review the clinical presentation and the proposed triage decision.'
        ),
        jsonb_build_object(
          'label', 'Your Task',
          'content', 'Determine if the decision is clinically appropriate given the patient information.'
        )
      )
    )
  ),
  2,
  NOW()
);

-- 2. Create test clinician (for manual testing)
DELETE FROM clinicians WHERE email = 'test@example.com';

INSERT INTO clinicians (email, name, access_code)
VALUES ('test@example.com', 'Test Clinician', 'TEST0001');

-- 3. Mark test clinician as eligible for the pool
DELETE FROM pool_eligibility
WHERE clinician_id = (SELECT id FROM clinicians WHERE email = 'test@example.com')
  AND pool_id = (SELECT id FROM pools WHERE name = 'Clinical Triage Assessment');

INSERT INTO pool_eligibility (clinician_id, pool_id, eligible, eligible_since, created_at)
SELECT c.id, p.id, true, NOW(), NOW()
FROM clinicians c, pools p
WHERE c.email = 'test@example.com' AND p.name = 'Clinical Triage Assessment';

-- Verify the setup
SELECT
  p.id as pool_id,
  p.name,
  p.ls_project_id,
  (p.eval_config ->> 'instructions') as instructions,
  jsonb_object_keys(p.eval_config -> 'schema' -> 'fields') as field_names
FROM pools p
WHERE p.name = 'Clinical Triage Assessment';
