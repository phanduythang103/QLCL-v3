-- Create the dsnkvm table for aggregate SSI reports
CREATE TABLE IF NOT EXISTS public.dsnkvm (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ngay_bao_cao DATE NOT NULL,
  khoa TEXT NOT NULL,
  tong_so_ca_pt INTEGER NOT NULL DEFAULT 0,
  so_ca_nkvm_nong INTEGER NOT NULL DEFAULT 0,
  so_ca_nkvm_sau INTEGER NOT NULL DEFAULT 0,
  so_ca_nkvm_co_quan INTEGER NOT NULL DEFAULT 0,
  tong_so_ca_nkvm INTEGER GENERATED ALWAYS AS (so_ca_nkvm_nong + so_ca_nkvm_sau + so_ca_nkvm_co_quan) STORED,
  ty_le_nkvm NUMERIC(5,2) GENERATED ALWAYS AS (
    CASE 
      WHEN tong_so_ca_pt > 0 
      THEN ROUND(((so_ca_nkvm_nong + so_ca_nkvm_sau + so_ca_nkvm_co_quan)::NUMERIC / tong_so_ca_pt::NUMERIC) * 100, 2)
      ELSE 0 
    END
  ) STORED,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Bật Row Level Security cho bảng
ALTER TABLE public.dsnkvm ENABLE ROW LEVEL SECURITY;

-- Allow all users to read dsnkvm data (Policy for reading)
CREATE POLICY "Cho phép tất cả người dùng xem dsnkvm"
  ON public.dsnkvm
  FOR SELECT
  USING (true);

-- Allow all authenticated users to insert dsnkvm data (Policy for inserting)
CREATE POLICY "Cho phép người dùng đã đăng nhập thêm dsnkvm"
  ON public.dsnkvm
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Allow all users to update dsnkvm data
CREATE POLICY "Cho phép tất cả người dùng sửa dsnkvm"
  ON public.dsnkvm
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Allow all users to delete dsnkvm data
CREATE POLICY "Cho phép tất cả người dùng xóa dsnkvm"
  ON public.dsnkvm
  FOR DELETE
  USING (true);

-- Add index to improve performance on date and department lookups
CREATE INDEX IF NOT EXISTS dsnkvm_ngay_bao_cao_idx ON public.dsnkvm (ngay_bao_cao);
CREATE INDEX IF NOT EXISTS dsnkvm_khoa_idx ON public.dsnkvm (khoa);

-- Comment on table and columns
COMMENT ON TABLE public.dsnkvm IS 'Bảng lưu trữ dữ liệu báo cáo tổng hợp Nhiễm khuẩn vết mổ (NKVM)';
COMMENT ON COLUMN public.dsnkvm.tong_so_ca_nkvm IS 'Auto-calculated: nông + sâu + cơ quan';
COMMENT ON COLUMN public.dsnkvm.ty_le_nkvm IS 'Auto-calculated: (tổng NKVM / tổng số ca PT) * 100';
