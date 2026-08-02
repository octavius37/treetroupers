ALTER TABLE public.pages
  ADD COLUMN parent_id uuid REFERENCES public.pages(id) ON DELETE SET NULL,
  ADD COLUMN nav_order integer NOT NULL DEFAULT 0,
  ADD COLUMN show_in_nav boolean NOT NULL DEFAULT true;

-- Index for the nav query (published + ordering)
CREATE INDEX pages_nav_idx ON public.pages (status, show_in_nav, nav_order);
CREATE INDEX pages_parent_id_idx ON public.pages (parent_id);
