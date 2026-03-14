-- Create table bc_nhan_luc_ca (Báo cáo nhân lực theo ca)
CREATE TABLE IF NOT EXISTS public.bc_nhan_luc_ca (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    ngay_bao_cao DATE NOT NULL,
    nguoi_bao_cao TEXT NOT NULL,
    khoa_bao_cao TEXT NOT NULL,
    
    -- Ca sáng
    sang_dd INTEGER DEFAULT 0,
    sang_nb INTEGER DEFAULT 0,
    sang_ty_le NUMERIC(10, 2) DEFAULT 0,
    sang_an_toan TEXT,
    
    -- Ca chiều
    chieu_dd INTEGER DEFAULT 0,
    chieu_nb INTEGER DEFAULT 0,
    chieu_ty_le NUMERIC(10, 2) DEFAULT 0,
    chieu_an_toan TEXT,
    
    -- Ca đêm
    dem_dd INTEGER DEFAULT 0,
    dem_nb INTEGER DEFAULT 0,
    dem_ty_le NUMERIC(10, 2) DEFAULT 0,
    dem_an_toan TEXT
);

-- Enable RLS
ALTER TABLE public.bc_nhan_luc_ca ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "bc_nhan_luc_ca_select_policy" ON public.bc_nhan_luc_ca;
DROP POLICY IF EXISTS "bc_nhan_luc_ca_insert_policy" ON public.bc_nhan_luc_ca;
DROP POLICY IF EXISTS "bc_nhan_luc_ca_update_policy" ON public.bc_nhan_luc_ca;
DROP POLICY IF EXISTS "bc_nhan_luc_ca_delete_policy" ON public.bc_nhan_luc_ca;

CREATE POLICY "bc_nhan_luc_ca_select_policy" ON public.bc_nhan_luc_ca FOR SELECT USING (true);
CREATE POLICY "bc_nhan_luc_ca_insert_policy" ON public.bc_nhan_luc_ca FOR INSERT WITH CHECK (true);
CREATE POLICY "bc_nhan_luc_ca_update_policy" ON public.bc_nhan_luc_ca FOR UPDATE USING (true);
CREATE POLICY "bc_nhan_luc_ca_delete_policy" ON public.bc_nhan_luc_ca FOR DELETE USING (true);

-- Comment
COMMENT ON TABLE public.bc_nhan_luc_ca IS 'Bảng báo cáo nhân lực điều dưỡng theo ca trực';
