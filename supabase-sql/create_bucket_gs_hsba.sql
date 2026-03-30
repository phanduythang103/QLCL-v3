-- Create a new storage bucket named 'gs_hsba'
INSERT INTO storage.buckets (id, name, public)
VALUES ('gs_hsba', 'gs_hsba', true)
ON CONFLICT (id) DO NOTHING;

-- 1. Cho phép mọi người xem file (Public Select)
CREATE POLICY "Public Access gs_hsba" ON storage.objects
    FOR SELECT
    USING (bucket_id = 'gs_hsba');

-- 2. Cho phép mọi người tải lên file (Public Insert)
CREATE POLICY "Public Insert gs_hsba" ON storage.objects
    FOR INSERT
    WITH CHECK (bucket_id = 'gs_hsba');

-- 3. Cho phép mọi người cập nhật file (Public Update)
CREATE POLICY "Public Update gs_hsba" ON storage.objects
    FOR UPDATE
    USING (bucket_id = 'gs_hsba');

-- 4. Cho phép mọi người xóa file (Public Delete)
CREATE POLICY "Public Delete gs_hsba" ON storage.objects
    FOR DELETE
    USING (bucket_id = 'gs_hsba');
