-- Bảng: bo_83_tieu_chi (Bộ 83 tiêu chí chất lượng bệnh viện)
-- Mô tả: Lưu trữ danh mục và điểm chấm 83 tiêu chí theo QĐ 6858

CREATE TABLE bo_83_tieu_chi (
    id SERIAL PRIMARY KEY,
    ma_tieu_chi VARCHAR(20) NOT NULL,   -- VD: A1.1, B2.1, C3.1
    nhom VARCHAR(10) NOT NULL,          -- A, B, C, D, E
    ten_nhom VARCHAR(255),              -- Tên nhóm tiêu chí
    ten_tieu_chi TEXT NOT NULL,         -- Tên tiêu chí
    don_vi_phu_trach VARCHAR(255),      -- Đơn vị/Khoa phòng phụ trách
    diem_tu_cham DECIMAL(3,1) DEFAULT 0,-- Điểm tự chấm (0-5)
    diem_doan_cham DECIMAL(3,1) DEFAULT 0,-- Điểm đoàn chấm (0-5)
    so_minh_chung INT DEFAULT 0,        -- Số lượng minh chứng đính kèm
    trang_thai VARCHAR(50) DEFAULT 'PENDING',-- PENDING, DRAFT, REVIEW, DONE
    nam_danh_gia VARCHAR(10),           -- Năm đánh giá: 2024
    ghi_chu TEXT,
    ngay_cap_nhat DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE bo_83_tieu_chi ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users
CREATE POLICY "Allow all for authenticated users" ON bo_83_tieu_chi
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Indexes
CREATE INDEX idx_bo_83_tieu_chi_nhom ON bo_83_tieu_chi(nhom);
CREATE INDEX idx_bo_83_tieu_chi_trang_thai ON bo_83_tieu_chi(trang_thai);
CREATE INDEX idx_bo_83_tieu_chi_nam ON bo_83_tieu_chi(nam_danh_gia);

-- Sample data
INSERT INTO bo_83_tieu_chi (ma_tieu_chi, nhom, ten_nhom, ten_tieu_chi, don_vi_phu_trach, diem_tu_cham, diem_doan_cham, so_minh_chung, trang_thai, nam_danh_gia) VALUES
('A1.1', 'A', 'Hướng đến người bệnh', 'Người bệnh được chỉ dẫn rõ ràng, đón tiếp niềm nở', 'Phòng KHTH', 4, 4, 3, 'DONE', '2024'),
('A1.2', 'A', 'Hướng đến người bệnh', 'Thủ tục khám bệnh, chữa bệnh cải tiến, đơn giản', 'Khoa Khám bệnh', 3, 3, 1, 'DONE', '2024'),
('B2.1', 'B', 'Phát triển nguồn nhân lực', 'Nhân viên y tế được đào tạo về kỹ năng giao tiếp', 'Phòng TCCB', 5, 4, 5, 'REVIEW', '2024'),
('C3.1', 'C', 'Hoạt động chuyên môn', 'Bảo đảm an toàn sinh học tại phòng xét nghiệm', 'Khoa Xét nghiệm', 0, 0, 0, 'PENDING', '2024'),
('C4.2', 'C', 'Hoạt động chuyên môn', 'Tuân thủ quy trình kiểm soát nhiễm khuẩn', 'Khoa KSNK', 4, 0, 2, 'DRAFT', '2024'),
('D1.1', 'D', 'Cải tiến chất lượng', 'Bệnh viện có chương trình cải tiến chất lượng rõ ràng', 'Phòng QLCL', 4, 4, 4, 'DONE', '2024'),
('E1.1', 'E', 'Đặc thù chuyên khoa', 'Đáp ứng yêu cầu đặc thù của chuyên khoa', 'Các khoa lâm sàng', 4, 0, 2, 'REVIEW', '2024');
