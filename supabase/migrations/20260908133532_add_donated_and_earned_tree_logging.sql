-- Support logging donated and earned trees alongside planted ones. Those
-- entries have no GPS location or species, so location is relaxed to
-- optional and only enforced (via check constraint, not NOT NULL) for
-- source = 'planted'.
alter table public.trees
  alter column location drop not null,
  add column source text not null default 'planted'
    check (source in ('planted', 'donated', 'earned')),
  add column quantity integer not null default 1
    check (quantity > 0),
  add column donation_project text,
  add column earned_activity text,
  add constraint trees_location_required_when_planted
    check (source <> 'planted' or location is not null);
