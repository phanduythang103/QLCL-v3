-- Create the hieu_suat_phong_mo table
CREATE TABLE hieu_suat_phong_mo (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ngay_bao_cao DATE NOT NULL,
    nguoi_bao_cao TEXT NOT NULL,
    phong_mo_so TEXT NOT NULL,
    chuyen_khoa TEXT NOT NULL,
    gio_mo_thuc_te NUMERIC(10, 2) NOT NULL DEFAULT 0,
    gio_hoat_dong_dinh_muc NUMERIC(10, 2) NOT NULL DEFAULT 8, -- Default to 8 hours
    hieu_suat NUMERIC(5, 2) NOT NULL DEFAULT 0,
    danh_gia TEXT NOT NULL, -- Lãng phí nguồn lực, Bình thường, Nguy cơ áp lực do quá tải
    ghi_chu TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE hieu_suat_phong_mo ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for authenticated users" ON hieu_suat_phong_mo
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert access for authenticated users" ON hieu_suat_phong_mo
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update access for authenticated users" ON hieu_suat_phong_mo
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete access for authenticated users" ON hieu_suat_phong_mo
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create indexes for faster querying
CREATE INDEX idx_hieu_suat_phong_mo_ngay ON hieu_suat_phong_mo(ngay_bao_cao);
CREATE INDEX idx_hieu_suat_phong_mo_phong ON hieu_suat_phong_mo(phong_mo_so);
CREATE INDEX idx_hieu_suat_phong_mo_khoa ON hieu_suat_phong_mo(chuyen_khoa);
