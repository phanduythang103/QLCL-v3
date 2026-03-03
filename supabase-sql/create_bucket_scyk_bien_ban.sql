-- ============================================================
-- TẠO STORAGE BUCKET "scyk" CHO LƯU TRỮ BIÊN BẢN XÁC MINH SCYK
-- Chạy script này trong SQL Editor của Supabase Dashboard
-- ============================================================

-- BƯỚC 1: Tạo bucket "scyk" (public = true)
INSERT INTO storage.buckets (id, name, public)
VALUES ('scyk', 'scyk', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- BƯỚC 2: Xóa policies cũ nếu có (để tránh lỗi "already exists")
DROP POLICY IF EXISTS "scyk: Select all"  ON storage.objects;
DROP POLICY IF EXISTS "scyk: Insert all"  ON storage.objects;
DROP POLICY IF EXISTS "scyk: Update all"  ON storage.objects;
DROP POLICY IF EXISTS "scyk: Delete all"  ON storage.objects;
DROP POLICY IF EXISTS "scyk: Authenticated users can view files"   ON storage.objects;
DROP POLICY IF EXISTS "scyk: Authenticated users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "scyk: Authenticated users can update files" ON storage.objects;
DROP POLICY IF EXISTS "scyk: Authenticated users can delete files" ON storage.objects;

-- BƯỚC 3: Tạo lại policies đúng (không có TO authenticated)
CREATE POLICY "scyk: Select all" ON storage.objects FOR SELECT  USING     (bucket_id = 'scyk');
CREATE POLICY "scyk: Insert all" ON storage.objects FOR INSERT  WITH CHECK (bucket_id = 'scyk');
CREATE POLICY "scyk: Update all" ON storage.objects FOR UPDATE  USING     (bucket_id = 'scyk');
CREATE POLICY "scyk: Delete all" ON storage.objects FOR DELETE  USING     (bucket_id = 'scyk');

-- BƯỚC 4: Thêm cột file vào bảng biên bản (nếu chưa có)
ALTER TABLE bien_ban_xac_minh_su_co
  ADD COLUMN IF NOT EXISTS file_url  text,
  ADD COLUMN IF NOT EXISTS file_name text;
