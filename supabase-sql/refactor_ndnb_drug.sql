-- Drop existing tables
DROP TABLE IF EXISTS gs_ndnb CASCADE;
DROP TABLE IF EXISTS gs_ndnb_theokt CASCADE;
DROP TABLE IF EXISTS giam_sat_drug CASCADE;

-- Re-create gs_ndnb
CREATE TABLE gs_ndnb (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ngay_giam_sat DATE NOT NULL,
    nguoi_giam_sat VARCHAR(255) NOT NULL,
    khoa_duoc_giam_sat VARCHAR(255),
    doi_tuong_giam_sat VARCHAR(255),
    checklist_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    tong_dat INTEGER DEFAULT 0,
    tong_co_hoi INTEGER DEFAULT 10,
    ty_le_tuan_thu NUMERIC(5, 2) DEFAULT 0,
    danh_gia_chung VARCHAR(255),
    loi_sai_khac_phuc TEXT,
    ghi_chu TEXT
);

ALTER TABLE gs_ndnb ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cho phép tất cả người dùng xem dữ liệu gs_ndnb" ON gs_ndnb FOR SELECT USING (true);
CREATE POLICY "Cho phép tất cả người dùng thêm dữ liệu gs_ndnb" ON gs_ndnb FOR INSERT WITH CHECK (true);
CREATE POLICY "Cho phép tất cả người dùng cập nhật dữ liệu gs_ndnb" ON gs_ndnb FOR UPDATE USING (true);
CREATE POLICY "Cho phép tất cả người dùng xóa dữ liệu gs_ndnb" ON gs_ndnb FOR DELETE USING (true);


-- Re-create giam_sat_drug
CREATE TABLE giam_sat_drug (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ngay_giam_sat DATE NOT NULL,
    nguoi_giam_sat VARCHAR(255) NOT NULL,
    don_vi_duoc_giam_sat VARCHAR(255),
    ho_ten_nb VARCHAR(255),
    nam_sinh INTEGER,
    ma_nb VARCHAR(50),
    checklist_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    tong_dat INTEGER DEFAULT 0,
    tong_co_hoi INTEGER DEFAULT 8,
    ty_le_tuan_thu NUMERIC(5, 2) DEFAULT 0,
    danh_gia_chung VARCHAR(255),
    loi_sai_khac_phuc TEXT,
    ghi_chu TEXT
);

ALTER TABLE giam_sat_drug ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cho phép tất cả người dùng xem dữ liệu giam_sat_drug" ON giam_sat_drug FOR SELECT USING (true);
CREATE POLICY "Cho phép tất cả người dùng thêm dữ liệu giam_sat_drug" ON giam_sat_drug FOR INSERT WITH CHECK (true);
CREATE POLICY "Cho phép tất cả người dùng cập nhật dữ liệu giam_sat_drug" ON giam_sat_drug FOR UPDATE USING (true);
CREATE POLICY "Cho phép tất cả người dùng xóa dữ liệu giam_sat_drug" ON giam_sat_drug FOR DELETE USING (true);
