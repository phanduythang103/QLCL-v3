-- ==========================================================
-- FULL SETUP SCRIPT: PHÂN HỆ ĐÁNH GIÁ 83 TIÊU CHÍ CLBV
-- ==========================================================

-- 1. TẠO BẢNG KẾT QUẢ ĐÁNH GIÁ (Nếu chưa có)
CREATE TABLE IF NOT EXISTS public.kq_danh_gia_83tc (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ngay_danh_gia date NOT NULL DEFAULT CURRENT_DATE,
  nguoi_danh_gia text NOT NULL,
  don_vi_duoc_danh_gia text NOT NULL,
  phan text,
  chuong text,
  ma_tieu_muc text NOT NULL,
  tieu_muc text,
  nhom text,
  dat boolean DEFAULT false,
  khong_dat boolean DEFAULT false,
  dat_muc text,
  ghi_chu text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 2. CẬP NHẬT CÁC CỘT MỚI (Nếu đã có bảng từ trước)
ALTER TABLE public.kq_danh_gia_83tc ADD COLUMN IF NOT EXISTS khong_danh_gia boolean DEFAULT false;
ALTER TABLE public.kq_danh_gia_83tc ADD COLUMN IF NOT EXISTS hinh_anh_minh_chung jsonb DEFAULT '[]'::jsonb;

-- 3. TỐI ƯU HÓA DỮ LIỆU BẢNG DANH MỤC data83
-- Đảm bảo cột nhom và ma_tieu_muc là kiểu TEXT để không bị lỗi độ dài
ALTER TABLE public.data83 ALTER COLUMN nhom TYPE TEXT;
ALTER TABLE public.data83 ALTER COLUMN ma_tieu_muc TYPE TEXT;

-- 4. THIẾT LẬP INDEX CHO TRUY VẤN NHANH
CREATE INDEX IF NOT EXISTS idx_kq83_ngay ON public.kq_danh_gia_83tc(ngay_danh_gia);
CREATE INDEX IF NOT EXISTS idx_kq83_don_vi ON public.kq_danh_gia_83tc(don_vi_duoc_danh_gia);
CREATE INDEX IF NOT EXISTS idx_kq83_ma_tieu_muc ON public.kq_danh_gia_83tc(ma_tieu_muc);

-- 5. CẤU HÌNH BẢO MẬT (RLS)
ALTER TABLE public.kq_danh_gia_83tc ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'kq_danh_gia_83tc' AND policyname = 'Allow all actions for authenticated users'
    ) THEN
        CREATE POLICY "Allow all actions for authenticated users" ON public.kq_danh_gia_83tc
        FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

-- 6. THIẾT LẬP STORAGE BUCKET: minh_chung_83tc
-- Lưu ý: Nếu chạy lệnh này bị lỗi quyền, hãy tạo Bucket tên 'minh_chung_83tc' thủ công trên Dashboard Supabase.
INSERT INTO storage.buckets (id, name, public) 
VALUES ('minh_chung_83tc', 'minh_chung_83tc', true)
ON CONFLICT (id) DO NOTHING;

-- Policies cho Storage
DO $$ 
BEGIN
    -- Select Access
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Public Access 83tc') THEN
        CREATE POLICY "Public Access 83tc" ON storage.objects FOR SELECT USING (bucket_id = 'minh_chung_83tc');
    END IF;
    
    -- Insert Access
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Auth Upload 83tc') THEN
        CREATE POLICY "Auth Upload 83tc" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'minh_chung_83tc');
    END IF;

    -- Update/Delete
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Auth Edit 83tc') THEN
        CREATE POLICY "Auth Edit 83tc" ON storage.objects FOR UPDATE USING (bucket_id = 'min_chung_83tc');
    END IF;
END $$;
