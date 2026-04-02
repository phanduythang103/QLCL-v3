-- Create the Admission & Discharge Monitoring table
CREATE TABLE IF NOT EXISTS gs_ra_vao_vien (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),

    -- General Information
    ngay_giam_sat TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    nguoi_gs TEXT NOT NULL,
    khoa_gs TEXT NOT NULL,
    doi_tuong_gs TEXT[] DEFAULT '{}', -- [Vào viện, Chuyển khoa, Chuyển viện, Ra viện]

    -- I. CHẾ ĐỘ VÀO VIỆN
    c1 BOOLEAN NOT NULL DEFAULT true, c1_ghi_chu TEXT,
    c2 BOOLEAN NOT NULL DEFAULT true, c2_ghi_chu TEXT,
    c3 BOOLEAN NOT NULL DEFAULT true, c3_ghi_chu TEXT,

    -- II. CHẾ ĐỘ CHUYỂN KHOA
    c4 BOOLEAN NOT NULL DEFAULT true, c4_ghi_chu TEXT,
    c5 BOOLEAN NOT NULL DEFAULT true, c5_ghi_chu TEXT,
    c6 BOOLEAN NOT NULL DEFAULT true, c6_ghi_chu TEXT,

    -- III. CHẾ ĐỘ CHUYỂN VIỆN
    c7 BOOLEAN NOT NULL DEFAULT true, c7_ghi_chu TEXT,
    c8 BOOLEAN NOT NULL DEFAULT true, c8_ghi_chu TEXT,
    c9 BOOLEAN NOT NULL DEFAULT true, c9_ghi_chu TEXT,

    -- IV. CHẾ ĐỘ RA VIỆN
    c10 BOOLEAN NOT NULL DEFAULT true, c10_ghi_chu TEXT,
    c11 BOOLEAN NOT NULL DEFAULT true, c11_ghi_chu TEXT,
    c12 BOOLEAN NOT NULL DEFAULT true, c12_ghi_chu TEXT,

    -- V. AN TOÀN NGƯỜI BỆNH & TÀI SẢN
    c13 BOOLEAN NOT NULL DEFAULT true, c13_ghi_chu TEXT,
    c14 BOOLEAN NOT NULL DEFAULT true, c14_ghi_chu TEXT,

    -- Summary fields
    ket_luan_chung TEXT,
    hinh_anh_minh_chung TEXT[] DEFAULT '{}',
    tong_dat INTEGER DEFAULT 14,
    tong_tieu_chi INTEGER DEFAULT 14,
    ty_le_tuan_thu DECIMAL(5,2) DEFAULT 100.00
);

-- Enable RLS
ALTER TABLE gs_ra_vao_vien ENABLE ROW LEVEL SECURITY;

-- Create policies (Allow all authenticated users)
CREATE POLICY "Enable all for authenticated users ra_vao_vien" ON gs_ra_vao_vien
    FOR ALL 
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_gs_ra_vao_vien_khoa ON gs_ra_vao_vien(khoa_gs);
CREATE INDEX IF NOT EXISTS idx_gs_ra_vao_vien_ngay ON gs_ra_vao_vien(ngay_giam_sat);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_ra_vao_vien()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ra_vao_vien_updated_at
    BEFORE UPDATE ON gs_ra_vao_vien
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_ra_vao_vien();

COMMENT ON TABLE gs_ra_vao_vien IS 'Bảng giám sát chế độ ra vào viện, chuyển viện';
