-- Two claimable rewards. A member claims one at its points threshold (points
-- are never spent); an admin sees the claim on /cms/rewards, emails the member
-- to arrange it and marks it sent. Added only where no reward of that title
-- exists, so one an admin already created isn't duplicated.
insert into public.rewards (title, description, points_required, type)
select v.title, v.description, v.points_required, v.type
from (values
  ('Seed Pack',
   'A pack of tree seeds to grow your own. We''ll email you to arrange delivery or pick-up.',
   300, 'physical'),
  ('A Tree Planted in Your Name',
   'We plant a tree in your name. We''ll email you when it''s planted.',
   1000, 'custom')
) as v(title, description, points_required, type)
where not exists (
  select 1 from public.rewards r where lower(r.title) = lower(v.title)
);
