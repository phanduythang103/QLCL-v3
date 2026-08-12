-- Create table for gs_ns_dai_tru_trang
CREATE TABLE gs_ns_dai_tru_trang (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ngay_giam_sat DATE NOT NULL,
    nguoi_giam_sat VARCHAR(255) NOT NULL,
    khoa_phong VARCHAR(255),
    nguoi_duoc_giam_sat VARCHAR(255),
    checklist_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    tong_dat INTEGER DEFAULT 0,
    tong_co_hoi INTEGER DEFAULT 32,
    ty_le_tuan_thu NUMERIC(5, 2) DEFAULT 0,
    danh_gia_chung VARCHAR(255),
    loi_sai_khac_phuc TEXT,
    ghi_chu TEXT
);

-- Enable Row Level Security
ALTER TABLE gs_ns_dai_tru_trang ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Cho phép tất cả người dùng xem dữ liệu gs_ns_dai_tru_trang" ON gs_ns_dai_tru_trang
    FOR SELECT USING (true);

CREATE POLICY "Cho phép tất cả người dùng thêm dữ liệu gs_ns_dai_tru_trang" ON gs_ns_dai_tru_trang
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Cho phép tất cả người dùng cập nhật dữ liệu gs_ns_dai_tru_trang" ON gs_ns_dai_tru_trang
    FOR UPDATE USING (true);

CREATE POLICY "Cho phép tất cả người dùng xóa dữ liệu gs_ns_dai_tru_trang" ON gs_ns_dai_tru_trang
    FOR DELETE USING (true);
