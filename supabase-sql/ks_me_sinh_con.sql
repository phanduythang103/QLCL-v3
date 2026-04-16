-- Enable uuid extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create table ks_me_sinh_con
CREATE TABLE IF NOT EXISTS public.ks_me_sinh_con (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at timestamp with time zone DEFAULT now(),
  
  -- Admin section
  hospital text,
  survey_date date,
  departments text,
  department_code text,
  mother_id text,
  
  -- Patient section
  age integer,
  phone text,
  days_in_hospital integer,
  visit_count integer,
  bhyt smallint,
  birth_method smallint,
  birth_method_other text,
  prenatal_check smallint,
  prenatal_check_other text,
  
  -- Evaluation Matrix (EA-EH)
  ea1 smallint,
  ea2 smallint,
  eb1 smallint,
  eb2 smallint,
  ec1 smallint,
  ec2 smallint,
  ec3 smallint,
  ed1 smallint,
  ed2 smallint,
  ed3 smallint,
  ed4 smallint,
  ed5 smallint,
  ed6 smallint,
  ee1 smallint,
  ee2 smallint,
  ee3 smallint,
  ee4 smallint,
  eg1 smallint,
  eg2 smallint,
  eg3 smallint,
  eh1 smallint,
  eh2 smallint,
  eh3 smallint,
  
  -- Overall section
  overall_satisfaction smallint DEFAULT 5,
  satisfaction_percent integer,
  return_intent smallint,
  return_intent_other text,
  note text
);

-- Enable Row Level Security
ALTER TABLE public.ks_me_sinh_con ENABLE ROW LEVEL SECURITY;

-- Policy allowing full access for anon role
CREATE POLICY "anon_full_access" ON public.ks_me_sinh_con
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Grant permissions to anon role
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ks_me_sinh_con TO anon;
