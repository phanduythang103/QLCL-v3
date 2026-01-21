-- Bảng: phieu_giam_sat (Phiếu giám sát/Checklist)
-- Mô tả: Lưu trữ các phiếu giám sát và kết quả tuân thủ

CREATE TABLE phieu_giam_sat (
    id SERIAL PRIMARY KEY,
    ten_phieu VARCHAR(255) NOT NULL,         -- Tên phiếu giám sát
    loai_giam_sat VARCHAR(50),               -- SURGERY, DRUGS, HAND_HYGIENE, 5S, PROFESSIONAL, RECORDS, GENERAL
    khoa_phong VARCHAR(255),                 -- Khoa/Phòng được giám sát
    ngay_kiem_tra DATE,                      -- Ngày kiểm tra
    nguoi_kiem_tra VARCHAR(255),
    ty_le_tuan_thu DECIMAL(5,2),             -- Tỷ lệ tuân thủ (%)
    ket_qua VARCHAR(50),                     -- Đạt, Không đạt, Khá
    noi_dung_chi_tiet JSONB,                 -- Chi tiết các mục kiểm tra (dạng JSON)
    ghi_chu TEXT,
    trang_thai VARCHAR(50) DEFAULT 'Hoàn thành',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE phieu_giam_sat ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users
CREATE POLICY "Allow all for authenticated users" ON phieu_giam_sat
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Index
CREATE INDEX idx_phieu_giam_sat_loai ON phieu_giam_sat(loai_giam_sat);
CREATE INDEX idx_phieu_giam_sat_ngay ON phieu_giam_sat(ngay_kiem_tra);

-- Sample data
INSERT INTO phieu_giam_sat (ten_phieu, loai_giam_sat, khoa_phong, ngay_kiem_tra, nguoi_kiem_tra, ty_le_tuan_thu, ket_qua) VALUES
('Kiểm tra Vệ sinh tay Khoa Nội', 'HAND_HYGIENE', 'Khoa Nội', '2024-06-12', 'Nguyễn Văn A', 95, 'Đạt'),
('Kiểm tra 5S Khoa Ngoại', '5S', 'Khoa Ngoại', '2024-06-10', 'Trần Thị B', 80, 'Khá'),
('Giám sát An toàn PT PM số 1', 'SURGERY', 'Phòng mổ số 1', '2024-06-11', 'BS. Hùng', 100, 'Đạt'),
('Kiểm tra Hồ sơ bệnh án Khoa Tim mạch', 'RECORDS', 'Khoa Tim mạch', '2024-06-09', 'Nguyễn Thị C', 88, 'Khá'),
('Giám sát Công khai thuốc Khoa Ngoại', 'DRUGS', 'Khoa Ngoại', '2024-06-08', 'Lê Văn D', 92, 'Đạt');
