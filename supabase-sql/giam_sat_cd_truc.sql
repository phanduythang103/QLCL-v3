-- Table for Monitoring Professional Duty Mode (Giám sát Chế độ trực)
CREATE TABLE giam_sat_cd_truc (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

    ngay_kiem_tra DATE NOT NULL DEFAULT CURRENT_DATE,
    nguoi_kiem_tra TEXT NOT NULL,
    don_vi_duoc_kiem_tra TEXT NOT NULL, -- Đơn vị được kiểm tra

    -- I. HANH CHINH & TO CHUC
    c1 BOOLEAN DEFAULT true, -- Có bảng phân công trực được phê duyệt và niêm yết công khai.
    c1_ghi_chu TEXT,
    c2 BOOLEAN DEFAULT true, -- Các thành viên trực có mặt đầy đủ, đúng vị trí, mặc trang phục đúng quy định.
    c2_ghi_chu TEXT,
    c3 BOOLEAN DEFAULT true, -- Sổ trực ghi chép đầy đủ các thành phần.
    c3_ghi_chu TEXT,
    c4 BOOLEAN DEFAULT true, -- Thực hiện bàn giao ca trực nghiêm túc, có chữ ký.
    c4_ghi_chu TEXT,

    -- II. CHUYEN MON KY THUAT
    c5 BOOLEAN DEFAULT true, -- Nắm chắc số lượng bệnh nhân tại khoa.
    c5_ghi_chu TEXT,
    c6 BOOLEAN DEFAULT true, -- Thăm khám bệnh nhân nặng kịp thời, ghi chép diễn biến.
    c6_ghi_chu TEXT,
    c7 BOOLEAN DEFAULT true, -- Đảm bảo thông tin liên lạc thông suốt.
    c7_ghi_chu TEXT,
    c8 BOOLEAN DEFAULT true, -- Xử lý các tình huống cấp cứu đúng phác đồ.
    c8_ghi_chu TEXT,

    -- III. SAN SANG CHIEN DAU & CAP CUU
    c9 BOOLEAN DEFAULT true, -- Túi cấp cứu, các trang thiết bị ở trạng thái sẵn sàng.
    c9_ghi_chu TEXT,
    c10 BOOLEAN DEFAULT true, -- Cơ số thuốc cấp cứu, dịch truyền đầy đủ.
    c10_ghi_chu TEXT,
    c11 BOOLEAN DEFAULT true, -- Kíp trực nắm chắc phương án xử lý tình huống cấp cứu hàng loạt.
    c11_ghi_chu TEXT,

    -- IV. TRAT TU NOI VU & KY LUAT
    c12 BOOLEAN DEFAULT true, -- Buồng trực sạch sẽ, ngăn nắp (5S).
    c12_ghi_chu TEXT,
    c13 BOOLEAN DEFAULT true, -- Quản lý tốt bệnh nhân và người nhà bệnh nhân.
    c13_ghi_chu TEXT,

    ket_luan_chung TEXT,
    hinh_anh_minh_chung TEXT[], -- Array of image URLs (gs_hsba bucket or similar)
    
    -- Stats
    tong_dat INTEGER DEFAULT 13,
    tong_tieu_chi INTEGER DEFAULT 13,
    ty_le_tuan_thu NUMERIC(5,2) DEFAULT 100.00
);

-- Enable RLS
ALTER TABLE giam_sat_cd_truc ENABLE ROW LEVEL SECURITY;

-- Create policies (Allow all authenticated users for now, matching hospital environment)
CREATE POLICY "Enable all for authenticated users cd_truc" ON giam_sat_cd_truc
    FOR ALL 
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Updated_at trigger
CREATE TRIGGER set_updated_at_cd_truc
    BEFORE UPDATE ON giam_sat_cd_truc
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Indexes
CREATE INDEX idx_cd_truc_ngay ON giam_sat_cd_truc(ngay_kiem_tra DESC);
CREATE INDEX idx_cd_truc_don_vi ON giam_sat_cd_truc(don_vi_duoc_kiem_tra);
CREATE INDEX idx_cd_truc_nguoi ON giam_sat_cd_truc(nguoi_kiem_tra);
