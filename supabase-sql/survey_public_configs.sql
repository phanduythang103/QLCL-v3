-- ==========================================================
-- SURVEY SYSTEM CONFIGURATION & RLS POLICIES
-- Goal: Fix database access for custom user authentication
-- ==========================================================

-- 1. TABLE: survey_public_configs
CREATE TABLE IF NOT EXISTS public.survey_public_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    survey_type TEXT UNIQUE NOT NULL, 
    survey_name TEXT NOT NULL,
    is_public BOOLEAN DEFAULT false,
    slug TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('ict'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('ict'::text, now())
);

-- Ensure slug column exists (for existing tables)
ALTER TABLE public.survey_public_configs ADD COLUMN IF NOT EXISTS slug TEXT;
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'survey_public_configs_slug_key') THEN
        ALTER TABLE public.survey_public_configs ADD CONSTRAINT survey_public_configs_slug_key UNIQUE (slug);
    END IF;
END $$;

ALTER TABLE public.survey_public_configs ENABLE ROW LEVEL SECURITY;

-- Re-runnable Policy for survey_public_configs
DROP POLICY IF EXISTS "Public Config: Select all" ON public.survey_public_configs;
CREATE POLICY "Public Config: Select all" ON public.survey_public_configs FOR SELECT USING (true);

-- Ensure initial seed data
INSERT INTO public.survey_public_configs (survey_type, survey_name, is_public, slug)
VALUES 
    ('staff', 'Khảo sát hài lòng nhân viên y tế 2026', false, 'nvyt-2026'),
    ('inpatient', 'Khảo sát hài lòng người bệnh nội trú 2026', false, 'noi-tru-2026'),
    ('outpatient', 'Khảo sát hài lòng người bệnh ngoại trú 2026', false, 'ngoai-tru-2026'),
    ('ks_nuoi_con', 'Khảo sát thực hiện nuôi con bằng sữa mẹ', false, 'nuoi-con-sua-me'),
    ('ks_me_sinh_con', 'Khảo sát ý kiến người mẹ sinh con', false, 'me-sinh-con')
ON CONFLICT (survey_type) DO UPDATE 
SET survey_name = EXCLUDED.survey_name,
    slug = COALESCE(public.survey_public_configs.slug, EXCLUDED.slug);


-- 2. SURVEY TABLES RLS (Custom Auth Compatibility)
-- Note: Since the app uses a custom 'users' table and not Supabase Auth,
-- we must allow 'anon' role to SELECT/INSERT so the dashboard works.

-- --- 2.1 Inpatient (ksnb_noi_tru) ---
ALTER TABLE public.ksnb_noi_tru ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Inpatient: Anonymous Insert" ON public.ksnb_noi_tru;
DROP POLICY IF EXISTS "Inpatient: Public Select" ON public.ksnb_noi_tru;
DROP POLICY IF EXISTS "Inpatient: Admin Full Access" ON public.ksnb_noi_tru;

CREATE POLICY "Inpatient: Anonymous Insert" ON public.ksnb_noi_tru FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Inpatient: Public Select" ON public.ksnb_noi_tru FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Inpatient: Admin Full Access" ON public.ksnb_noi_tru FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- --- 2.2 Outpatient (ksnb_ngoai_tru) ---
ALTER TABLE public.ksnb_ngoai_tru ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Outpatient: Anonymous Insert" ON public.ksnb_ngoai_tru;
DROP POLICY IF EXISTS "Outpatient: Public Select" ON public.ksnb_ngoai_tru;
DROP POLICY IF EXISTS "Outpatient: Admin Full Access" ON public.ksnb_ngoai_tru;

CREATE POLICY "Outpatient: Anonymous Insert" ON public.ksnb_ngoai_tru FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Outpatient: Public Select" ON public.ksnb_ngoai_tru FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Outpatient: Admin Full Access" ON public.ksnb_ngoai_tru FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- --- 2.3 Staff (staff_satisfaction_2026_responses) ---
ALTER TABLE public.staff_satisfaction_2026_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff: Anonymous Insert" ON public.staff_satisfaction_2026_responses;
DROP POLICY IF EXISTS "Staff: Public Select" ON public.staff_satisfaction_2026_responses;
DROP POLICY IF EXISTS "Staff: Admin Full Access" ON public.staff_satisfaction_2026_responses;

CREATE POLICY "Staff: Anonymous Insert" ON public.staff_satisfaction_2026_responses FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Staff: Public Select" ON public.staff_satisfaction_2026_responses FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Staff: Admin Full Access" ON public.staff_satisfaction_2026_responses FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- --- 2.4 Nuôi con bằng sữa mẹ (ks_nuoi_con) ---
ALTER TABLE public.ks_nuoi_con ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "KsNuoiCon: Anonymous Insert" ON public.ks_nuoi_con;
DROP POLICY IF EXISTS "KsNuoiCon: Public Select" ON public.ks_nuoi_con;
DROP POLICY IF EXISTS "KsNuoiCon: Admin Full Access" ON public.ks_nuoi_con;
DROP POLICY IF EXISTS "anon_full_access" ON public.ks_nuoi_con;

CREATE POLICY "KsNuoiCon: Anonymous Insert" ON public.ks_nuoi_con FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "KsNuoiCon: Public Select" ON public.ks_nuoi_con FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "KsNuoiCon: Admin Full Access" ON public.ks_nuoi_con FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- --- 2.5 Người mẹ sinh con (ks_me_sinh_con) ---
ALTER TABLE public.ks_me_sinh_con ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "KsMeSinhCon: Anonymous Insert" ON public.ks_me_sinh_con;
DROP POLICY IF EXISTS "KsMeSinhCon: Public Select" ON public.ks_me_sinh_con;
DROP POLICY IF EXISTS "KsMeSinhCon: Admin Full Access" ON public.ks_me_sinh_con;
DROP POLICY IF EXISTS "anon_full_access" ON public.ks_me_sinh_con;

CREATE POLICY "KsMeSinhCon: Anonymous Insert" ON public.ks_me_sinh_con FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "KsMeSinhCon: Public Select" ON public.ks_me_sinh_con FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "KsMeSinhCon: Admin Full Access" ON public.ks_me_sinh_con FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- 3. PERMISSIONS SYNCHRONIZATION
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT SELECT, INSERT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
