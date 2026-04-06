
-- Create survey_public_configs table
CREATE TABLE IF NOT EXISTS public.survey_public_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    survey_type TEXT UNIQUE NOT NULL, -- 'staff', 'inpatient', 'outpatient'
    survey_name TEXT NOT NULL,
    is_public BOOLEAN DEFAULT false,
    slug TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('ict'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('ict'::text, now())
);

-- Enable RLS
ALTER TABLE public.survey_public_configs ENABLE ROW LEVEL SECURITY;

-- Select policy: Everyone can read configs (to check if public)
CREATE POLICY "Public Config: Select all" ON public.survey_public_configs
    FOR SELECT USING (true);

-- Admin policy: authenticated users can do everything
CREATE POLICY "Public Config: Admin full access" ON public.survey_public_configs
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Insert initial data
INSERT INTO public.survey_public_configs (survey_type, survey_name, slug, is_public)
VALUES 
    ('staff', 'Khảo sát hài lòng nhân viên y tế', 'nvyt-2026', false),
    ('inpatient', 'Khảo sát hài lòng người bệnh nội trú', 'noitru-2026', false),
    ('outpatient', 'Khảo sát hài lòng người bệnh ngoại trú', 'ngoaitru-2026', false)
ON CONFLICT (survey_type) DO NOTHING;

-- Update RLS for satisfaction tables to be more professional
-- Goal: Allow INSERT for anyone, but keep SELECT/UPDATE/DELETE for authenticated users only.

-- 1. Inpatient
ALTER TABLE public.ksnb_noi_tru ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for everyone" ON public.ksnb_noi_tru;
CREATE POLICY "Inpatient: Anonymous Insert" ON public.ksnb_noi_tru FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Inpatient: Authenticated Select" ON public.ksnb_noi_tru FOR SELECT TO authenticated USING (true);
CREATE POLICY "Inpatient: Authenticated Update" ON public.ksnb_noi_tru FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Inpatient: Authenticated Delete" ON public.ksnb_noi_tru FOR DELETE TO authenticated USING (true);

-- 2. Outpatient
ALTER TABLE public.ksnb_ngoai_tru ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_ksnb_ngoai_tru" ON public.ksnb_ngoai_tru;
DROP POLICY IF EXISTS "anon_insert_ksnb_ngoai_tru" ON public.ksnb_ngoai_tru;
DROP POLICY IF EXISTS "anon_update_ksnb_ngoai_tru" ON public.ksnb_ngoai_tru;
DROP POLICY IF EXISTS "anon_delete_ksnb_ngoai_tru" ON public.ksnb_ngoai_tru;

CREATE POLICY "Outpatient: Anonymous Insert" ON public.ksnb_ngoai_tru FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Outpatient: Authenticated Select" ON public.ksnb_ngoai_tru FOR SELECT TO authenticated USING (true);
CREATE POLICY "Outpatient: Authenticated Update" ON public.ksnb_ngoai_tru FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Outpatient: Authenticated Delete" ON public.ksnb_ngoai_tru FOR DELETE TO authenticated USING (true);

-- 3. Staff
ALTER TABLE public.staff_satisfaction_2026_responses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Staff: Anonymous Insert" ON public.staff_satisfaction_2026_responses;
DROP POLICY IF EXISTS "Staff: Authenticated Select" ON public.staff_satisfaction_2026_responses;

CREATE POLICY "Staff: Anonymous Insert" ON public.staff_satisfaction_2026_responses FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Staff: Authenticated Select" ON public.staff_satisfaction_2026_responses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff: Authenticated Update" ON public.staff_satisfaction_2026_responses FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Staff: Authenticated Delete" ON public.staff_satisfaction_2026_responses FOR DELETE TO authenticated USING (true);
