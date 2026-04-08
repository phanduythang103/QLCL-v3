-- Enable uuid extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create table ks_nuoi_con
CREATE TABLE IF NOT EXISTS public.ks_nuoi_con (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at timestamp with time zone DEFAULT now(),
  -- Admin section
  hospital text,
  survey_date date,
  department text,
  department_code text,
  patient_id text,
  -- Patient section
  age integer,
  phone text,
  visit_count integer,
  days_in_hospital integer,
  birth_count integer,
  delivery_type smallint,
  baby_birth_date date,
  -- Breastfeeding section (checkbox fields stored as integer arrays)
  see_policy integer[],
  see_media integer[],
  consultation_time integer[],
  reason_no_consult smallint,
  cord_cut smallint,
  skin_to_skin smallint,
  first_breastfeed smallint,
  support_person integer[],
  support_type integer[],
  other_food smallint,
  suggest_formula smallint,
  benefits text,
  exclusive_months integer,
  total_months integer,
  suggestions text
);

-- Enable Row Level Security
ALTER TABLE public.ks_nuoi_con ENABLE ROW LEVEL SECURITY;

-- Policy allowing full access for anon role
CREATE POLICY "anon_full_access" ON public.ks_nuoi_con
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Grant permissions to anon role
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ks_nuoi_con TO anon;

-- Optional: allow anon to use uuid_generate_v4 (already granted via extension)

-- End of script
