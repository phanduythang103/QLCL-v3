-- Create the phan_tich_thoi_gian_chet_pm table
CREATE TABLE phan_tich_thoi_gian_chet_pm (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ngay_bao_cao DATE NOT NULL,
    nguoi_bao_cao TEXT NOT NULL,
    phong_mo_so TEXT NOT NULL,
    chuyen_khoa TEXT NOT NULL,
    chi_tiet JSONB NOT NULL DEFAULT '[]', -- Array of { milestone: string, time_min: number, reason: string }
    total_downtime NUMERIC(10, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE phan_tich_thoi_gian_chet_pm ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for authenticated users" ON phan_tich_thoi_gian_chet_pm
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert access for authenticated users" ON phan_tich_thoi_gian_chet_pm
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update access for authenticated users" ON phan_tich_thoi_gian_chet_pm
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete access for authenticated users" ON phan_tich_thoi_gian_chet_pm
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create indexes
CREATE INDEX idx_thoi_gian_chet_pm_ngay ON phan_tich_thoi_gian_chet_pm(ngay_bao_cao);
CREATE INDEX idx_thoi_gian_chet_pm_phong ON phan_tich_thoi_gian_chet_pm(phong_mo_so);
CREATE INDEX idx_thoi_gian_chet_pm_khoa ON phan_tich_thoi_gian_chet_pm(chuyen_khoa);
