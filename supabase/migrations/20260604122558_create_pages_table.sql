CREATE TABLE pages (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title        text NOT NULL,
  slug         text NOT NULL UNIQUE,
  content      text,
  status       text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
