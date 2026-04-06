-- ksnb_ngoai_tru table schema generated from ks-nb-ngoai-tru.json template
-- Enable uuid-ossp extension for UUID primary keys
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table definition
CREATE TABLE IF NOT EXISTS public.ksnb_ngoai_tru (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    -- General information
    full_name VARCHAR(255),
    phone VARCHAR(50),
    area VARCHAR(50),               -- e.g., kham_dan, kham_quan, bhyt, yeu_cau, pk232
    visit_time TIMESTAMP WITH TIME ZONE, -- date + shift (Sáng/Chiều)
    respondent VARCHAR(50),        -- patient or relative
    -- Rating questions (q1‑q15) – 0 = not applicable, 1‑5 scale
    q1 SMALLINT CHECK (q1 >= 0 AND q1 <= 5),
    q2 SMALLINT CHECK (q2 >= 0 AND q2 <= 5),
    q3 SMALLINT CHECK (q3 >= 0 AND q3 <= 5),
    q4 SMALLINT CHECK (q4 >= 0 AND q4 <= 5),
    q5 SMALLINT CHECK (q5 >= 0 AND q5 <= 5),
    q6 SMALLINT CHECK (q6 >= 0 AND q6 <= 5),
    q7 SMALLINT CHECK (q7 >= 0 AND q7 <= 5),
    q8 SMALLINT CHECK (q8 >= 0 AND q8 <= 5),
    q9 SMALLINT CHECK (q9 >= 0 AND q9 <= 5),
    q10 SMALLINT CHECK (q10 >= 0 AND q10 <= 5),
    q11 SMALLINT CHECK (q11 >= 0 AND q11 <= 5),
    q12 SMALLINT CHECK (q12 >= 0 AND q12 <= 5),
    q13 SMALLINT CHECK (q13 >= 0 AND q13 <= 5),
    q14 SMALLINT CHECK (q14 >= 0 AND q14 <= 5),
    q15 SMALLINT CHECK (q15 >= 0 AND q15 <= 5),
    -- Detailed waiting‑issue analysis (checkbox list, stored as JSONB)
    waiting_issues JSONB,
    -- Priority improvement selection (checkbox list, stored as JSONB)
    priority_improvement JSONB,
    priority_improvement_other TEXT,
    -- Additional free‑text feedback
    feedback TEXT,
    -- Metadata timestamps
    ngay_khao_sat TIMESTAMP WITH TIME ZONE DEFAULT timezone('ict'::text, now()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('ict'::text, now())
);

-- Row Level Security
ALTER TABLE public.ksnb_ngoai_tru ENABLE ROW LEVEL SECURITY;

-- Policies granting full CRUD to anon role
CREATE POLICY "anon_select_ksnb_ngoai_tru"
    ON public.ksnb_ngoai_tru FOR SELECT TO anon USING (true);

CREATE POLICY "anon_insert_ksnb_ngoai_tru"
    ON public.ksnb_ngoai_tru FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "anon_update_ksnb_ngoai_tru"
    ON public.ksnb_ngoai_tru FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "anon_delete_ksnb_ngoai_tru"
    ON public.ksnb_ngoai_tru FOR DELETE TO anon USING (true);

-- Grant privileges to relevant roles
GRANT ALL ON TABLE public.ksnb_ngoai_tru TO anon;
GRANT ALL ON TABLE public.ksnb_ngoai_tru TO authenticated;
GRANT ALL ON TABLE public.ksnb_ngoai_tru TO service_role;
