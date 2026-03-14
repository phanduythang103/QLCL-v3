-- Create table for Indicator Configuration (Cấu hình chỉ số chất lượng)
CREATE TABLE IF NOT EXISTS public.cau_hinh_cscl (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    ten_chi_so TEXT NOT NULL,
    muc_tieu NUMERIC,
    tu_ngay DATE,
    den_ngay DATE,
    linh_vuc_ap_dung TEXT,
    thong_tin TEXT
);

-- Enable Row Level Security
ALTER TABLE public.cau_hinh_cscl ENABLE ROW LEVEL SECURITY;

-- Create policy for public access (Select, Insert, Update, Delete)
DROP POLICY IF EXISTS "Public All Access" ON public.cau_hinh_cscl;
CREATE POLICY "Public All Access" ON public.cau_hinh_cscl
FOR ALL 
TO public
USING (true)
WITH CHECK (true);

-- Add comments for documentation
COMMENT ON TABLE public.cau_hinh_cscl IS 'Bảng cấu hình chỉ số chất lượng (Mục tiêu, thời gian, lĩnh vực)';
COMMENT ON COLUMN public.cau_hinh_cscl.ten_chi_so IS 'Tên chỉ số chất lượng';
COMMENT ON COLUMN public.cau_hinh_cscl.muc_tieu IS 'Mục tiêu (con số)';
COMMENT ON COLUMN public.cau_hinh_cscl.tu_ngay IS 'Ngày áp dụng bắt đầu';
COMMENT ON COLUMN public.cau_hinh_cscl.den_ngay IS 'Ngày kết thúc áp dụng';
COMMENT ON COLUMN public.cau_hinh_cscl.linh_vuc_ap_dung IS 'Lĩnh vực áp dụng (Ví dụ: Lâm sàng, Cận lâm sàng...)';
COMMENT ON COLUMN public.cau_hinh_cscl.thong_tin IS 'Thông tin chi tiết/Ghi chú';
