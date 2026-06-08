-- Table to store 83 criteria assessment results specifically for Teams
CREATE TABLE IF NOT EXISTS public.kq_danh_gia_83tc_to (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phieu_id TEXT NOT NULL,
    nguoi_tao_id UUID REFERENCES auth.users(id),
    ngay_danh_gia DATE NOT NULL,
    nguoi_danh_gia TEXT NOT NULL,
    don_vi_duoc_danh_gia TEXT NOT NULL,
    to_danh_gia TEXT NOT NULL, -- identifies the assessing team
    
    phan TEXT,
    chuong TEXT,
    tieu_chi TEXT,
    ma_tieu_muc TEXT NOT NULL,
    tieu_muc TEXT,
    nhom TEXT,
    
    dat BOOLEAN DEFAULT false,
    khong_dat BOOLEAN DEFAULT false,
    khong_danh_gia BOOLEAN DEFAULT false,
    dat_muc TEXT,
    ghi_chu TEXT,
    hinh_anh_minh_chung TEXT[], -- array of URLs
    muc_dat_duoc INTEGER,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_83tc_to_phieu_id ON public.kq_danh_gia_83tc_to(phieu_id);
CREATE INDEX IF NOT EXISTS idx_83tc_to_team ON public.kq_danh_gia_83tc_to(to_danh_gia);
CREATE INDEX IF NOT EXISTS idx_83tc_to_date ON public.kq_danh_gia_83tc_to(ngay_danh_gia);

-- Enable RLS
ALTER TABLE public.kq_danh_gia_83tc_to ENABLE ROW LEVEL SECURITY;

-- Policies
-- The application uses its own users table/localStorage auth, not Supabase Auth.
-- Keep this table aligned with the other 83TC result table so anon API requests
-- made with the public anon key can read/write through RLS.
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.kq_danh_gia_83tc_to;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.kq_danh_gia_83tc_to;
DROP POLICY IF EXISTS "Enable update for owners" ON public.kq_danh_gia_83tc_to;
DROP POLICY IF EXISTS "Enable delete for owners" ON public.kq_danh_gia_83tc_to;
DROP POLICY IF EXISTS "Allow all actions for app users" ON public.kq_danh_gia_83tc_to;

CREATE POLICY "Allow all actions for app users" ON public.kq_danh_gia_83tc_to
    FOR ALL USING (true) WITH CHECK (true);
