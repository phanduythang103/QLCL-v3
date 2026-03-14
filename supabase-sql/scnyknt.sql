-- Create table scnyknt (Giám sát An toàn & Vận hành)
CREATE TABLE IF NOT EXISTS public.scnyknt (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    ngay_giam_sat DATE NOT NULL DEFAULT CURRENT_DATE,
    nguoi_giam_sat TEXT NOT NULL,
    vi_tri_giam_sat TEXT NOT NULL,
    c1_dat BOOLEAN DEFAULT FALSE,
    c1_ghi_chu TEXT,
    c2_dat BOOLEAN DEFAULT FALSE,
    c2_ghi_chu TEXT,
    c3_dat BOOLEAN DEFAULT FALSE,
    c3_ghi_chu TEXT,
    c4_dat BOOLEAN DEFAULT FALSE,
    c4_ghi_chu TEXT,
    c5_dat BOOLEAN DEFAULT FALSE,
    c5_ghi_chu TEXT,
    c6_dat BOOLEAN DEFAULT FALSE,
    c6_ghi_chu TEXT
);

-- Enable RLS
ALTER TABLE public.scnyknt ENABLE ROW LEVEL SECURITY;

-- Clean up ALL possible old policies to avoid conflicts
DROP POLICY IF EXISTS "Enable read access for all" ON public.scnyknt;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.scnyknt;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.scnyknt;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.scnyknt;
DROP POLICY IF EXISTS "Enable insert for all" ON public.scnyknt;
DROP POLICY IF EXISTS "Enable update for all" ON public.scnyknt;
DROP POLICY IF EXISTS "Enable delete for all" ON public.scnyknt;
DROP POLICY IF EXISTS "scnyknt_select" ON public.scnyknt;
DROP POLICY IF EXISTS "scnyknt_insert" ON public.scnyknt;
DROP POLICY IF EXISTS "scnyknt_update" ON public.scnyknt;
DROP POLICY IF EXISTS "scnyknt_delete" ON public.scnyknt;

-- Create NEW clean policies (Matching working scyk_nghiem_trong pattern)
CREATE POLICY "scnyknt_select_policy" ON public.scnyknt FOR SELECT USING (true);
CREATE POLICY "scnyknt_insert_policy" ON public.scnyknt FOR INSERT WITH CHECK (true);
CREATE POLICY "scnyknt_update_policy" ON public.scnyknt FOR UPDATE USING (true);
CREATE POLICY "scnyknt_delete_policy" ON public.scnyknt FOR DELETE USING (true);

-- Comment
COMMENT ON TABLE public.scnyknt IS 'Bảng kiểm giám sát an toàn, vận hành hệ thống';
