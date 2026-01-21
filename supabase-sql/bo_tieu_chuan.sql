-- Bảng: bo_tieu_chuan (Bộ tiêu chuẩn cơ bản)
-- Mô tả: Lưu trữ danh sách các bộ tiêu chuẩn chất lượng cơ bản

CREATE TABLE bo_tieu_chuan (
    id SERIAL PRIMARY KEY,
    ma_tieu_chuan VARCHAR(50) NOT NULL, -- VD: TC-VS, TC-ATNB
    ten_tieu_chuan VARCHAR(255) NOT NULL,-- Tên bộ tiêu chuẩn
    don_vi_phu_trach VARCHAR(255),       -- Đơn vị phụ trách
    tan_suat VARCHAR(100),               -- Tần suất đánh giá: "Hàng tháng", "Hàng quý"
    trang_thai VARCHAR(50) DEFAULT 'ACTIVE',-- ACTIVE, INACTIVE
    ghi_chu TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE bo_tieu_chuan ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users
CREATE POLICY "Allow all for authenticated users" ON bo_tieu_chuan
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Sample data
INSERT INTO bo_tieu_chuan (ma_tieu_chuan, ten_tieu_chuan, don_vi_phu_trach, tan_suat, trang_thai) VALUES
('TC-VS', 'Tiêu chuẩn Vệ sinh bệnh viện (Xanh - Sạch - Đẹp)', 'Phòng HCQT', 'Hàng tháng', 'ACTIVE'),
('TC-ATNB', 'Tiêu chuẩn An toàn người bệnh cơ bản', 'Phòng KHTH', 'Hàng quý', 'ACTIVE'),
('TC-DD', 'Tiêu chuẩn Chăm sóc người bệnh toàn diện', 'Phòng Điều dưỡng', 'Hàng tháng', 'ACTIVE'),
('TC-GT', 'Tiêu chuẩn Giao tiếp ứng xử', 'Phòng TCCB', 'Đột xuất', 'ACTIVE');

-- Bảng: ket_qua_danh_gia (Kết quả đánh giá theo bộ tiêu chuẩn)
CREATE TABLE ket_qua_danh_gia (
    id SERIAL PRIMARY KEY,
    bo_tieu_chuan_id INT REFERENCES bo_tieu_chuan(id),
    ten_tieu_chuan VARCHAR(255),         -- Cache tên để hiển thị
    don_vi_duoc_danh_gia VARCHAR(255) NOT NULL,-- Khoa/Phòng được đánh giá
    ngay_danh_gia DATE NOT NULL,
    diem_so DECIMAL(5,2),                -- Điểm số (0-100)
    ket_qua VARCHAR(50),                 -- Đạt, Không đạt
    nguoi_danh_gia VARCHAR(255),
    ghi_chu TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE ket_qua_danh_gia ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users
CREATE POLICY "Allow all for authenticated users" ON ket_qua_danh_gia
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Sample data
INSERT INTO ket_qua_danh_gia (bo_tieu_chuan_id, ten_tieu_chuan, don_vi_duoc_danh_gia, ngay_danh_gia, diem_so, ket_qua) VALUES
(1, 'Tiêu chuẩn Vệ sinh bệnh viện', 'Khoa Nội Tiêu hóa', '2024-06-15', 95, 'Đạt'),
(1, 'Tiêu chuẩn Vệ sinh bệnh viện', 'Khoa Ngoại Dã chiến', '2024-06-15', 88, 'Đạt'),
(2, 'Tiêu chuẩn An toàn người bệnh cơ bản', 'Khoa Hồi sức tích cực', '2024-06-12', 92, 'Đạt');
