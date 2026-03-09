ALTER TABLE giam_sat_vptm ENABLE ROW LEVEL SECURITY;
-- Bảng giám sát Viêm phổi liên quan máy thở (VPTM/VAP)
-- MONITORING CRITERIA:
-- 1. Người bệnh nằm đầu cao từ 30° đến 45° (nếu không có chống chỉ định)
-- 2. Vệ sinh răng miệng bằng dung dịch sát khuẩn ít nhất 2 lần/ngày
-- 3. Tuân thủ vệ sinh tay trước và sau khi thực hiện các kỹ thuật chăm sóc hô hấp
-- 4. Dụng cụ hỗ trợ hô hấp (canula, mask, dây máy thở) sạch, khô, đúng quy định
-- 5. Quy trình hút đờm kín/hở đảm bảo vô khuẩn (nếu có)
-- 6. Đổ nước đọng trong bẫy nước máy thở đúng cách, không để chảy ngược vào phổi

CREATE TABLE IF NOT EXISTS giam_sat_vptm (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ngay_giam_sat DATE NOT NULL DEFAULT CURRENT_DATE,
    nguoi_giam_sat TEXT NOT NULL,
    don_vi_duoc_gs TEXT NOT NULL,
    ho_ten_nb TEXT NOT NULL,
    gioi_tinh TEXT CHECK (gioi_tinh IN ('Nam', 'Nữ')),
    nam_sinh INTEGER,
    phong_benh TEXT,
    giuong_benh TEXT,
    
    -- Chi tiết nội dung giám sát (Đạt: true, Không đạt: false)
    c1_dau_cao BOOLEAN,
    c1_ghi_chu TEXT,
    
    c2_vs_rang_mieng BOOLEAN,
    c2_ghi_chu TEXT,
    
    c3_vs_tay BOOLEAN,
    c3_ghi_chu TEXT,
    
    c4_dung_cu_ho_hap BOOLEAN,
    c4_ghi_chu TEXT,
    
    c5_hut_dom BOOLEAN,
    c5_ghi_chu TEXT,
    
    c6_bay_nuoc BOOLEAN,
    c6_ghi_chu TEXT,
    
    -- Kết quả tổng hợp
    tong_dat INTEGER DEFAULT 0,
    tong_tieu_chi INTEGER DEFAULT 6,
    ty_le_tuan_thu NUMERIC(5, 2) DEFAULT 0, -- Tỷ lệ phần trăm (%)
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index để tìm kiếm nhanh
CREATE INDEX IF NOT EXISTS idx_giam_sat_vptm_ngay ON giam_sat_vptm(ngay_giam_sat);
CREATE INDEX IF NOT EXISTS idx_giam_sat_vptm_don_vi ON giam_sat_vptm(don_vi_duoc_gs);

-- Trigger cập nhật updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_giam_sat_vptm_updated_at
BEFORE UPDATE ON giam_sat_vptm
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Thêm comment cho các cột (PostgreSQL syntax)
COMMENT ON COLUMN giam_sat_vptm.c1_dau_cao IS '1. Người bệnh nằm đầu cao từ 30-45 độ';
COMMENT ON COLUMN giam_sat_vptm.c2_vs_rang_mieng IS '2. Vệ sinh răng miệng bằng dung dịch sát khuẩn >= 2 lần/ngày';
COMMENT ON COLUMN giam_sat_vptm.c3_vs_tay IS '3. Tuân thủ vệ sinh tay trước/sau kỹ thuật hô hấp';
COMMENT ON COLUMN giam_sat_vptm.c4_dung_cu_ho_hap IS '4. Dụng cụ hỗ trợ hô hấp sạch, khô, đúng quy định';
COMMENT ON COLUMN giam_sat_vptm.c5_hut_dom IS '5. Quy trình hút đờm đảm bảo vô khuẩn';
COMMENT ON COLUMN giam_sat_vptm.c6_bay_nuoc IS '6. Đổ nước đọng bẫy nước đúng cách';

-- Enable RLS

-- Allow all operations for all users (anon and authenticated)
CREATE POLICY "Allow all operations" ON giam_sat_vptm
    FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);
