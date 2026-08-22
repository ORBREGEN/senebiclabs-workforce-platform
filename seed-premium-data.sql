-- Update test pool with premium eval_config including instructions and hints
UPDATE pools
SET eval_config = jsonb_build_object(
  'instructions',
  'Judge the clinical decision against current medical guidelines. Mark "Has errors" only for clinically material errors—not style, formatting, or minor issues. If the case is unclear or outside your clinical area, flag it rather than guessing. Consider: (1) Appropriateness of the action given the patient state, (2) Alignment with standard protocols, (3) Any contraindications or safety issues.',
  'schema', jsonb_build_object(
    'fields', jsonb_build_array(
      jsonb_build_object(
        'name', 'verdict',
        'type', 'single',
        'title', 'Is this decision correct?',
        'hint', 'Judge clinical accuracy against guidelines. Flag if unsure.',
        'options', jsonb_build_array('Correct', 'Has errors', 'Unclear'),
        'required', true
      ),
      jsonb_build_object(
        'name', 'notes',
        'type', 'text',
        'title', 'Explain your assessment',
        'hint', 'What did you look for? Any concerns? (Optional but helpful)',
        'rows', 4,
        'required', false
      )
    ),
    'context', jsonb_build_array(
      jsonb_build_object(
        'label', 'Case',
        'content', 'Review the clinical decision and patient context. Determine if the action is appropriate and safe.'
      )
    )
  )
)
WHERE name = 'Test Pool' OR id = '1';
