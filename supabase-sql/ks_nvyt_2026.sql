-- staff_satisfaction_2026_responses table schema
-- Enable uuid-ossp extension for UUID primary keys
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table definition
CREATE TABLE IF NOT EXISTS public.staff_satisfaction_2026_responses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    -- General Information
    block VARCHAR(50),      -- clinical, subclinical, admin
    position VARCHAR(100),   -- doctor, nurse, contract
    years INTEGER,
    
    -- Rating questions (q1-q13) - 1-5 scale
    q1 SMALLINT CHECK (q1 >= 1 AND q1 <= 5),
    q2 SMALLINT CHECK (q2 >= 1 AND q2 <= 5),
    q3 SMALLINT CHECK (q3 >= 1 AND q3 <= 5),
    q4 SMALLINT CHECK (q4 >= 1 AND q4 <= 5),
    q5 SMALLINT CHECK (q5 >= 1 AND q5 <= 5),
    q6 SMALLINT CHECK (q6 >= 1 AND q6 <= 5),
    q7 SMALLINT CHECK (q7 >= 1 AND q7 <= 5),
    q8 SMALLINT CHECK (q8 >= 1 AND q8 <= 5),
    q9 SMALLINT CHECK (q9 >= 1 AND q9 <= 5),
    q10 SMALLINT CHECK (q10 >= 1 AND q10 <= 5),
    q11 SMALLINT CHECK (q11 >= 1 AND q11 <= 5),
    q12 SMALLINT CHECK (q12 >= 1 AND q12 <= 5),
    q13 SMALLINT CHECK (q13 >= 1 AND q13 <= 5),
    
    -- Root Cause Analysis & Suggestions
    pressure JSONB,         -- Array of pressure values
    pressure_other TEXT,
    financial_suggestion TEXT,
    stay_intent VARCHAR(50), -- stay, consider, leave
    suggestion TEXT,
    
    -- Metadata
    ngay_khao_sat TIMESTAMP WITH TIME ZONE DEFAULT timezone('ict'::text, now()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('ict'::text, now())
);

-- Row Level Security
ALTER TABLE public.staff_satisfaction_2026_responses ENABLE ROW LEVEL SECURITY;

-- Policies (consistent with survey_public_configs.sql)
DROP POLICY IF EXISTS "Staff: Anonymous Insert" ON public.staff_satisfaction_2026_responses;
DROP POLICY IF EXISTS "Staff: Public Select" ON public.staff_satisfaction_2026_responses;
DROP POLICY IF EXISTS "Staff: Admin Full Access" ON public.staff_satisfaction_2026_responses;

CREATE POLICY "Staff: Anonymous Insert" ON public.staff_satisfaction_2026_responses FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Staff: Public Select" ON public.staff_satisfaction_2026_responses FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Staff: Admin Full Access" ON public.staff_satisfaction_2026_responses FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Grant privileges
GRANT ALL ON TABLE public.staff_satisfaction_2026_responses TO anon;
GRANT ALL ON TABLE public.staff_satisfaction_2026_responses TO authenticated;
GRANT ALL ON TABLE public.staff_satisfaction_2026_responses TO service_role;
