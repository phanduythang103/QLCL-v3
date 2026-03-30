-- Table for Medical Records Monitoring (Giám sát HSBA)
CREATE TABLE giam_sat_hsba (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

    ngay_giam_sat DATE NOT NULL DEFAULT CURRENT_DATE,
    nguoi_giam_sat TEXT NOT NULL,
    khoa_duoc_giam_sat TEXT NOT NULL,
    ma_hsba TEXT NOT NULL,
    
    -- I. HANH CHINH VA PHAP LY
    c1 BOOLEAN DEFAULT true,
    c1_ghi_chu TEXT,
    c2 BOOLEAN DEFAULT true,
    c2_ghi_chu TEXT,
    c3 BOOLEAN DEFAULT true,
    c3_ghi_chu TEXT,
    
    -- II. CHAT LUONG CHUYEN MON (BAC SI)
    c4 BOOLEAN DEFAULT true,
    c4_ghi_chu TEXT,
    c5 BOOLEAN DEFAULT true,
    c5_ghi_chu TEXT,
    c6 BOOLEAN DEFAULT true,
    c6_ghi_chu TEXT,
    c7 BOOLEAN DEFAULT true,
    c7_ghi_chu TEXT,
    c8 BOOLEAN DEFAULT true,
    c8_ghi_chu TEXT,
    
    -- III. CHAT LUONG CHAM SOC (DIEU DUONG)
    c9 BOOLEAN DEFAULT true,
    c9_ghi_chu TEXT,
    c10 BOOLEAN DEFAULT true,
    c10_ghi_chu TEXT,
    c11 BOOLEAN DEFAULT true,
    c11_ghi_chu TEXT,
    
    -- IV. HINH THUC & TINH KIP THOI
    c12 BOOLEAN DEFAULT true,
    c12_ghi_chu TEXT,
    c13 BOOLEAN DEFAULT true,
    c13_ghi_chu TEXT,
    c14 BOOLEAN DEFAULT true,
    c14_ghi_chu TEXT,

    nhan_xet TEXT,
    hinh_anh_minh_chung TEXT[], -- Array of image URLs
    
    -- Stats
    tong_dat INTEGER DEFAULT 14,
    tong_tieu_chi INTEGER DEFAULT 14,
    ty_le_tuan_thu NUMERIC(5,2) DEFAULT 100.00
);

-- Enable RLS
ALTER TABLE giam_sat_hsba ENABLE ROW LEVEL SECURITY;

-- Public access policy (consistent with project pattern)
CREATE POLICY "Public Access giam_sat_hsba" ON giam_sat_hsba
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Updated_at trigger
CREATE TRIGGER set_updated_at_hsba
    BEFORE UPDATE ON giam_sat_hsba
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Indexes
CREATE INDEX idx_hsba_ngay ON giam_sat_hsba(ngay_giam_sat DESC);
CREATE INDEX idx_hsba_khoa ON giam_sat_hsba(khoa_duoc_giam_sat);
CREATE INDEX idx_hsba_ma ON giam_sat_hsba(ma_hsba);
