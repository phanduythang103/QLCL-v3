-- Bảng: lich_su_bao_cao (Lịch sử xuất báo cáo)
-- Mô tả: Lưu trữ lịch sử các báo cáo đã xuất

CREATE TABLE lich_su_bao_cao (
    id SERIAL PRIMARY KEY,
    ten_bao_cao VARCHAR(255) NOT NULL,   -- Tên báo cáo
    loai_bao_cao VARCHAR(50),            -- "Tháng", "Quý", "Năm"
    ky_bao_cao VARCHAR(50),              -- "05/2024", "Q1/2024", "2024"
    nguoi_tao VARCHAR(255),
    ngay_tao DATE DEFAULT CURRENT_DATE,
    duong_dan TEXT,                      -- Đường dẫn file (nếu lưu)
    trang_thai VARCHAR(50) DEFAULT 'Đã tạo',
    ghi_chu TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE lich_su_bao_cao ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users
CREATE POLICY "Allow all for authenticated users" ON lich_su_bao_cao
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Sample data
INSERT INTO lich_su_bao_cao (ten_bao_cao, loai_bao_cao, ky_bao_cao, nguoi_tao, ngay_tao) VALUES
('Báo cáo công tác QLCL Tháng 5/2024', 'Tháng', '05/2024', 'Nguyễn Văn A', '2024-06-02'),
('Báo cáo Sơ kết Quý 1/2024', 'Quý', 'Q1/2024', 'Trần Thị B', '2024-04-05'),
('Báo cáo sự cố y khoa Quý 1/2024', 'Quý', 'Q1/2024', 'Nguyễn Văn A', '2024-04-01');
