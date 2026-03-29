-- Table: public.giam_sat_drug
-- Description: Giám sát công khai thuốc (Recreated from scratch)

-- 1. Create the table with all columns and defaults
CREATE TABLE IF NOT EXISTS public.giam_sat_drug (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    ngay_giam_sat DATE NOT NULL,
    nguoi_giam_sat TEXT NOT NULL,
    don_vi_duoc_giam_sat TEXT NOT NULL,
    ho_ten_nb TEXT NOT NULL,
    nam_sinh INTEGER,
    ma_nb TEXT,
    
    -- I. HÌNH THỨC CÔNG KHAI
    tc1_phi_cong_khai_dau_giuong BOOLEAN DEFAULT true,
    tc1_phi_cong_khai_dau_giuong_ghi_chu TEXT,
    tc2_mau_phieu_dung_quy_dinh BOOLEAN DEFAULT true,
    tc2_mau_phieu_dung_quy_dinh_ghi_chu TEXT,
    
    -- II. NỘI DUNG CÔNG KHAI
    tc3_khop_y_lenh_benh_an BOOLEAN DEFAULT true,
    tc3_khop_y_lenh_benh_an_ghi_chu TEXT,
    tc4_ghi_cong_khai_hang_ngay BOOLEAN DEFAULT true,
    tc4_ghi_cong_khai_hang_ngay_ghi_chu TEXT,
    tc5_vat_tu_tieu_hao BOOLEAN DEFAULT true,
    tc5_vat_tu_tieu_hao_ghi_chu TEXT,
    
    -- III. TƯ VẤN VÀ GIẢI THÍCH
    tc6_giai_thich_tien_su_di_ung BOOLEAN DEFAULT true,
    tc6_giai_thich_tien_su_di_ung_ghi_chu TEXT,
    tc7_ky_xac_nhan_hang_ngay BOOLEAN DEFAULT true,
    tc7_ky_xac_nhan_hang_ngay_ghi_chu TEXT,
    
    -- IV. KIỂM TRA THỰC TẾ
    tc8_phong_van_nb_loai_thuoc BOOLEAN DEFAULT true,
    tc8_phong_van_nb_loai_thuoc_ghi_chu TEXT,
    tc9_nb_xac_nhan_so_thuoc BOOLEAN DEFAULT true,
    tc9_nb_xac_nhan_so_thuoc_ghi_chu TEXT,
    tc10_nb_khong_tu_mua_thuoc BOOLEAN DEFAULT true,
    tc10_nb_khong_tu_mua_thuoc_ghi_chu TEXT,
    
    ghi_chu TEXT,
    tong_dat INTEGER DEFAULT 10,
    ty_le_tuan_thu NUMERIC DEFAULT 100,
    hinh_anh TEXT[] DEFAULT '{}'
);

-- 2. Enable RLS
ALTER TABLE public.giam_sat_drug ENABLE ROW LEVEL SECURITY;

-- 3. Policies
DROP POLICY IF EXISTS "Allow authenticated users to read giam_sat_drug" ON public.giam_sat_drug;
CREATE POLICY "Allow all users to read giam_sat_drug" ON public.giam_sat_drug FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to insert giam_sat_drug" ON public.giam_sat_drug;
CREATE POLICY "Allow all users to insert giam_sat_drug" ON public.giam_sat_drug FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to update giam_sat_drug" ON public.giam_sat_drug;
CREATE POLICY "Allow all users to update giam_sat_drug" ON public.giam_sat_drug FOR UPDATE TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to delete giam_sat_drug" ON public.giam_sat_drug;
CREATE POLICY "Allow all users to delete giam_sat_drug" ON public.giam_sat_drug FOR DELETE TO public USING (true);

-- 4. Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_giam_sat_drug_updated_at ON public.giam_sat_drug;
CREATE TRIGGER update_giam_sat_drug_updated_at
    BEFORE UPDATE ON public.giam_sat_drug
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
