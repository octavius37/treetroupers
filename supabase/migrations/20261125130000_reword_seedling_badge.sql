-- The Seedling Badge unlocks at 50 points, like every badge, not specifically
-- for planting a first tree (joining five communities also reaches 50). Reword
-- it to say so. Only the original wording is changed, so a description an admin
-- has already edited on /cms/rewards is left alone.
update public.rewards
set description = 'Awarded at 50 points.'
where type = 'badge'
  and title = 'Seedling Badge'
  and description = 'Awarded for planting your first tree.';
