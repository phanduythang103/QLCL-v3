-- Supabase Storage Bucket Setup: giam_sat
-- Run this in the Supabase SQL Editor

-- 1. Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('giam_sat', 'giam_sat', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Remove existing policies to avoid conflicts
DROP POLICY IF EXISTS "giam_sat_read_access" ON storage.objects;
DROP POLICY IF EXISTS "giam_sat_insert_access" ON storage.objects;
DROP POLICY IF EXISTS "giam_sat_update_access" ON storage.objects;
DROP POLICY IF EXISTS "giam_sat_delete_access" ON storage.objects;

-- 3. Create security policies
CREATE POLICY "giam_sat_read_access"
ON storage.objects FOR SELECT
USING (bucket_id = 'giam_sat');

CREATE POLICY "giam_sat_insert_access"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'giam_sat');

CREATE POLICY "giam_sat_update_access"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'giam_sat');

CREATE POLICY "giam_sat_delete_access"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'giam_sat');
