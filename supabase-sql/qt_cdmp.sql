-- Drop existing table if exists
DROP TABLE IF EXISTS qt_cdmp CASCADE;

-- Create qt_cdmp table (Chọc hút dịch màng phổi)
CREATE TABLE qt_cdmp (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ngay_giam_sat DATE NOT NULL,
    nguoi_giam_sat VARCHAR(255) NOT NULL,
    khoa_duoc_giam_sat VARCHAR(255),
    nguoi_duoc_giam_sat VARCHAR(255),
    checklist_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    tong_dat INTEGER DEFAULT 0,
    tong_co_hoi INTEGER DEFAULT 11,
    ty_le_tuan_thu NUMERIC(5, 2) DEFAULT 0,
    danh_gia_chung VARCHAR(255),
    ghi_chu TEXT
);

ALTER TABLE qt_cdmp ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cho phép tất cả người dùng xem dữ liệu qt_cdmp" ON qt_cdmp FOR SELECT USING (true);
CREATE POLICY "Cho phép tất cả người dùng thêm dữ liệu qt_cdmp" ON qt_cdmp FOR INSERT WITH CHECK (true);
CREATE POLICY "Cho phép tất cả người dùng cập nhật dữ liệu qt_cdmp" ON qt_cdmp FOR UPDATE USING (true);
CREATE POLICY "Cho phép tất cả người dùng xóa dữ liệu qt_cdmp" ON qt_cdmp FOR DELETE USING (true);
