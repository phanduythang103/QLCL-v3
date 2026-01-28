-- 1. Tạo Storage Bucket: avatar
-- Bucket này dùng để lưu ảnh đại diện của người dùng
-- Lưu ý: Nếu chạy lệnh này bị lỗi quyền, hãy tạo Bucket tên 'avatar' thủ công trên Dashboard Supabase.

INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatar', 'avatar', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Thiết lập Policy cho Bucket avatar
-- Cho phép tất cả mọi người xem ảnh (public read)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Public Access Avatar'
    ) THEN
        CREATE POLICY "Public Access Avatar" ON storage.objects 
        FOR SELECT USING (bucket_id = 'avatar');
    END IF;
END $$;

-- Cho phép người dùng đã đăng nhập upload ảnh
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Auth Upload Avatar'
    ) THEN
        CREATE POLICY "Auth Upload Avatar" ON storage.objects 
        FOR INSERT WITH CHECK (bucket_id = 'avatar');
    END IF;
END $$;

-- Cho phép người dùng đã đăng nhập cập nhật ảnh
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Auth Update Avatar'
    ) THEN
        CREATE POLICY "Auth Update Avatar" ON storage.objects 
        FOR UPDATE USING (bucket_id = 'avatar');
    END IF;
END $$;

-- Cho phép người dùng đã đăng nhập xóa ảnh
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Auth Delete Avatar'
    ) THEN
        CREATE POLICY "Auth Delete Avatar" ON storage.objects 
        FOR DELETE USING (bucket_id = 'avatar');
    END IF;
END $$;

-- 3. Thêm cột avatar vào bảng users
-- Cột này lưu URL của ảnh đại diện trong storage bucket
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS avatar text;

-- Thêm comment để mô tả cột
COMMENT ON COLUMN users.avatar IS 'URL của ảnh đại diện trong storage bucket avatar';
