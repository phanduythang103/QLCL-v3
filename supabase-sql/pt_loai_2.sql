-- Create the pt_loai_2 table
CREATE TABLE IF NOT EXISTS public.pt_loai_2 (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ngay_bao_cao DATE NOT NULL,
  nguoi_bao_cao TEXT NOT NULL,
  khoa TEXT NOT NULL,
  tong_so_pt INTEGER NOT NULL DEFAULT 0,
  pt_loai_db INTEGER NOT NULL DEFAULT 0,
  pt_loai_1 INTEGER NOT NULL DEFAULT 0,
  pt_loai_2 INTEGER NOT NULL DEFAULT 0,
  tong_pt_loai_2_tro_len INTEGER GENERATED ALWAYS AS (pt_loai_db + pt_loai_1 + pt_loai_2) STORED,
  ty_le NUMERIC(5,2) GENERATED ALWAYS AS (
    CASE 
      WHEN tong_so_pt > 0 THEN (((pt_loai_db + pt_loai_1 + pt_loai_2) * 100.0) / tong_so_pt)::NUMERIC(5,2)
      ELSE 0.00
    END
  ) STORED,
  ghi_chu TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.pt_loai_2 ENABLE ROW LEVEL SECURITY;

-- Grant access to authenticated users
GRANT ALL ON TABLE public.pt_loai_2 TO authenticated;
GRANT ALL ON TABLE public.pt_loai_2 TO service_role;

-- Policies for Authenticated Users
-- 1. Select Policy
DROP POLICY IF EXISTS "Cho phép tất cả user đã đăng nhập xem dữ liệu PT loại 2" ON public.pt_loai_2;
CREATE POLICY "Cho phép xem tất cả dữ liệu PT loại 2" 
ON public.pt_loai_2 FOR SELECT 
USING (true);

-- 2. Insert Policy
DROP POLICY IF EXISTS "Cho phép user đã đăng nhập thêm dữ liệu PT loại 2" ON public.pt_loai_2;
CREATE POLICY "Cho phép thêm dữ liệu PT loại 2" 
ON public.pt_loai_2 FOR INSERT 
WITH CHECK (true);

-- 3. Update Policy
DROP POLICY IF EXISTS "Cho phép user đã đăng nhập cập nhật dữ liệu PT loại 2" ON public.pt_loai_2;
CREATE POLICY "Cho phép cập nhật dữ liệu PT loại 2" 
ON public.pt_loai_2 FOR UPDATE 
USING (true);

-- 4. Delete Policy
DROP POLICY IF EXISTS "Cho phép user đã đăng nhập xóa dữ liệu PT loại 2" ON public.pt_loai_2;
CREATE POLICY "Cho phép xóa dữ liệu PT loại 2" 
ON public.pt_loai_2 FOR DELETE 
USING (true);

-- Create index for faster queries by date and department
CREATE INDEX IF NOT EXISTS idx_pt_loai_2_ngay_bao_cao ON public.pt_loai_2(ngay_bao_cao);
CREATE INDEX IF NOT EXISTS idx_pt_loai_2_khoa ON public.pt_loai_2(khoa);
