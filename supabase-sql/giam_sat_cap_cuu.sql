-- Create the Emergency Monitoring table
CREATE TABLE IF NOT EXISTS giam_sat_cap_cuu (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),

    -- General Information
    ngay_kiem_tra TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    nguoi_kiem_tra TEXT NOT NULL,
    don_vi_duoc_kiem_tra TEXT NOT NULL,

    -- I. HÀNH CHÍNH & TIẾP NHẬN
    c1 BOOLEAN NOT NULL DEFAULT true, c1_ghi_chu TEXT,
    c2 BOOLEAN NOT NULL DEFAULT true, c2_ghi_chu TEXT,
    c3 BOOLEAN NOT NULL DEFAULT true, c3_ghi_chu TEXT,
    c4 BOOLEAN NOT NULL DEFAULT true, c4_ghi_chu TEXT,

    -- II. CHUYÊN MÔN & XỬ TRÍ
    c5 BOOLEAN NOT NULL DEFAULT true, c5_ghi_chu TEXT,
    c6 BOOLEAN NOT NULL DEFAULT true, c6_ghi_chu TEXT,
    c7 BOOLEAN NOT NULL DEFAULT true, c7_ghi_chu TEXT,
    c8 BOOLEAN NOT NULL DEFAULT true, c8_ghi_chu TEXT,

    -- III. TRANG THIẾT BỊ, THUỐC & XE CẤP CỨU
    c9 BOOLEAN NOT NULL DEFAULT true, c9_ghi_chu TEXT,
    c10 BOOLEAN NOT NULL DEFAULT true, c10_ghi_chu TEXT,
    c11 BOOLEAN NOT NULL DEFAULT true, c11_ghi_chu TEXT,

    -- IV. PHƯƠNG ÁN CẤP CỨU HÀNG LOẠT
    c12 BOOLEAN NOT NULL DEFAULT true, c12_ghi_chu TEXT,
    c13 BOOLEAN NOT NULL DEFAULT true, c13_ghi_chu TEXT,

    -- Summary fields
    ket_luan_chung TEXT,
    hinh_anh_minh_chung TEXT[] DEFAULT '{}',
    tong_dat INTEGER DEFAULT 13,
    tong_tieu_chi INTEGER DEFAULT 13,
    ty_le_tuan_thu DECIMAL(5,2) DEFAULT 100.00
);

-- Enable RLS
ALTER TABLE giam_sat_cap_cuu ENABLE ROW LEVEL SECURITY;

-- Create policies (Allow all authenticated users for now, matching hospital environment)
CREATE POLICY "Enable all for authenticated users cap_cuu" ON giam_sat_cap_cuu
    FOR ALL 
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_gs_cap_cuu_don_vi ON giam_sat_cap_cuu(don_vi_duoc_kiem_tra);
CREATE INDEX IF NOT EXISTS idx_gs_cap_cuu_ngay ON giam_sat_cap_cuu(ngay_kiem_tra);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_cap_cuu()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to call the function
CREATE TRIGGER update_cap_cuu_updated_at
    BEFORE UPDATE ON giam_sat_cap_cuu
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_cap_cuu();
