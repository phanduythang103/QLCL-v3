
-- 1. Tạo bảng thong_bao
CREATE TABLE IF NOT EXISTS thong_bao (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nguoi_tao_id uuid REFERENCES users(id),
    nguoi_tao_name text, -- Lưu tên để hiển thị nhanh
    ngay_tao timestamp with time zone DEFAULT now(),
    noi_dung text NOT NULL,
    don_vi_thuc_hien text[] DEFAULT '{}', -- Mảng các đơn vị
    ngay_bat_dau date,
    ngay_ket_thuc date,
    ghi_chu text,
    file_dinh_kem text, -- URL hoặc path trong bucket
    created_at timestamp with time zone DEFAULT now()
);

-- Bật RLS cho thong_bao
ALTER TABLE thong_bao ENABLE ROW LEVEL SECURITY;

-- Policy cho thong_bao
CREATE POLICY "Cho phép tất cả đọc thông báo" ON thong_bao FOR SELECT USING (true);
CREATE POLICY "Admin có toàn quyền với thông báo" ON thong_bao FOR ALL USING (true);

-- 2. Tạo bucket cv_file (Lưu ý: Thường thực hiện qua UI hoặc API, nhưng đây là hướng dẫn SQL)
-- Để tạo bucket qua SQL trong Supabase, ta chèn vào bảng storage.buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('cv_file', 'cv_file', true)
ON CONFLICT (id) DO NOTHING;

-- Policy cho bucket cv_file
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'cv_file');
CREATE POLICY "Authenticated Insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'cv_file');
CREATE POLICY "Authenticated Update" ON storage.objects FOR UPDATE USING (bucket_id = 'cv_file');
CREATE POLICY "Authenticated Delete" ON storage.objects FOR DELETE USING (bucket_id = 'cv_file');
