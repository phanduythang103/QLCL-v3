-- Fix RLS for hand-hygiene monitoring and its evidence-image bucket.
-- Run this once in the Supabase SQL Editor for an existing deployment.

BEGIN;

ALTER TABLE public.gs_vst ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "gs_vst_select_public" ON public.gs_vst;
DROP POLICY IF EXISTS "gs_vst_insert_public" ON public.gs_vst;
DROP POLICY IF EXISTS "gs_vst_update_public" ON public.gs_vst;
DROP POLICY IF EXISTS "gs_vst_delete_public" ON public.gs_vst;
DROP POLICY IF EXISTS "Enable read access for all" ON public.gs_vst;
DROP POLICY IF EXISTS "Enable insert for all" ON public.gs_vst;
DROP POLICY IF EXISTS "Enable update for all" ON public.gs_vst;
DROP POLICY IF EXISTS "Enable delete for all" ON public.gs_vst;

CREATE POLICY "gs_vst_select_public" ON public.gs_vst
    FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "gs_vst_insert_public" ON public.gs_vst
    FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "gs_vst_update_public" ON public.gs_vst
    FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "gs_vst_delete_public" ON public.gs_vst
    FOR DELETE TO anon, authenticated USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.gs_vst TO anon, authenticated;

INSERT INTO storage.buckets (id, name, public)
VALUES ('vst', 'vst', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "vst_select_public" ON storage.objects;
DROP POLICY IF EXISTS "vst_insert_public" ON storage.objects;
DROP POLICY IF EXISTS "vst_update_public" ON storage.objects;
DROP POLICY IF EXISTS "vst_delete_public" ON storage.objects;

CREATE POLICY "vst_select_public" ON storage.objects
    FOR SELECT TO anon, authenticated USING (bucket_id = 'vst');

CREATE POLICY "vst_insert_public" ON storage.objects
    FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'vst');

CREATE POLICY "vst_update_public" ON storage.objects
    FOR UPDATE TO anon, authenticated
    USING (bucket_id = 'vst')
    WITH CHECK (bucket_id = 'vst');

CREATE POLICY "vst_delete_public" ON storage.objects
    FOR DELETE TO anon, authenticated USING (bucket_id = 'vst');

COMMIT;
