-- Create table bc_scnyknt (Báo cáo Sự cố An toàn & Vận hành)
CREATE TABLE IF NOT EXISTS public.bc_scnyknt (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    ngay_bao_cao DATE NOT NULL DEFAULT CURRENT_DATE,
    nguoi_bao_cao TEXT NOT NULL,
    don_vi TEXT NOT NULL,
    thoi_gian_xay_ra TIMESTAMPTZ NOT NULL,
    vi_tri_xay_ra TEXT NOT NULL,
    mo_ta_dien_bien TEXT NOT NULL,
    hau_qua TEXT NOT NULL,
    bien_phap_xu_ly TEXT NOT NULL,
    nguyen_nhan_so_bo TEXT NOT NULL,
    hinh_anh_minh_chung TEXT[] DEFAULT '{}'
);

-- Enable RLS
ALTER TABLE public.bc_scnyknt ENABLE ROW LEVEL SECURITY;

-- Clean up ALL possible old policies to avoid conflicts
DROP POLICY IF EXISTS "Enable read access for all" ON public.bc_scnyknt;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.bc_scnyknt;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.bc_scnyknt;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.bc_scnyknt;
DROP POLICY IF EXISTS "Enable insert for all" ON public.bc_scnyknt;
DROP POLICY IF EXISTS "Enable update for all" ON public.bc_scnyknt;
DROP POLICY IF EXISTS "Enable delete for all" ON public.bc_scnyknt;
DROP POLICY IF EXISTS "bc_scnyknt_select" ON public.bc_scnyknt;
DROP POLICY IF EXISTS "bc_scnyknt_insert" ON public.bc_scnyknt;
DROP POLICY IF EXISTS "bc_scnyknt_update" ON public.bc_scnyknt;
DROP POLICY IF EXISTS "bc_scnyknt_delete" ON public.bc_scnyknt;

-- Create NEW clean policies
CREATE POLICY "bc_scnyknt_select_policy" ON public.bc_scnyknt FOR SELECT USING (true);
CREATE POLICY "bc_scnyknt_insert_policy" ON public.bc_scnyknt FOR INSERT WITH CHECK (true);
CREATE POLICY "bc_scnyknt_update_policy" ON public.bc_scnyknt FOR UPDATE USING (true);
CREATE POLICY "bc_scnyknt_delete_policy" ON public.bc_scnyknt FOR DELETE USING (true);

-- Comment
COMMENT ON TABLE public.bc_scnyknt IS 'Bảng báo cáo sự cố an toàn, vận hành hệ thống';
