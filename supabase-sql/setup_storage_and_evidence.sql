-- 1. Tạo Storage Bucket: minh_chung_83tc
-- Lưu ý: Câu lệnh này cần quyền admin hoặc chạy trong dashboard.
-- Nếu chạy qua API, Supabase có hỗ trợ SQL để insert vào schema storage.

INSERT INTO storage.buckets (id, name, public) 
VALUES ('minh_chung_83tc', 'minh_chung_83tc', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Thiết lập Policy cho Bucket
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'minh_chung_83tc');
CREATE POLICY "Auth Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'minh_chung_83tc');
CREATE POLICY "Auth Update" ON storage.objects FOR UPDATE USING (bucket_id = 'minh_chung_83tc');
CREATE POLICY "Auth Delete" ON storage.objects FOR DELETE USING (bucket_id = 'minh_chung_83tc');

-- 3. Cập nhật bảng kq_danh_gia_83tc để lưu danh sách ảnh minh chứng (kiểu JSONB để linh hoạt hơn)
ALTER TABLE public.kq_danh_gia_83tc ADD COLUMN IF NOT EXISTS hinh_anh_minh_chung jsonb DEFAULT '[]'::jsonb;
