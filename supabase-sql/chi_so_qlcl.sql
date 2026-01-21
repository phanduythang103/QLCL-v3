-- Bảng: chi_so_qlcl (Chỉ số Quản lý Chất lượng)
-- Mô tả: Lưu trữ các chỉ số chất lượng và giá trị thực tế theo thời gian

CREATE TABLE chi_so_qlcl (
    id SERIAL PRIMARY KEY,
    ten_chi_so VARCHAR(255) NOT NULL,  -- Tên chỉ số (VD: "Tỷ lệ tai biến phẫu thuật")
    nhom_chi_so VARCHAR(100),           -- Nhóm chỉ số (VD: "Chuyên môn & An toàn", "Hài lòng & Quản lý")
    don_vi_tinh VARCHAR(50) DEFAULT '%',-- Đơn vị tính (%, phút, người...)
    gia_tri DECIMAL(10,2),              -- Giá trị hiện tại
    muc_tieu DECIMAL(10,2),             -- Mục tiêu cần đạt
    gia_tri_max DECIMAL(10,2) DEFAULT 100,-- Giá trị tối đa để hiển thị thanh progress
    thang_nam VARCHAR(20),              -- Tháng/Năm đo (VD: "06/2024")
    khoa_phong VARCHAR(255),            -- Khoa/Phòng (null = toàn viện)
    xu_huong VARCHAR(20),               -- "tang" / "giam" / "on_dinh"
    mau_hien_thi VARCHAR(50),           -- Màu hiển thị (VD: "bg-green-500", "bg-red-500")
    ghi_chu TEXT,
    trang_thai VARCHAR(50) DEFAULT 'Đang theo dõi',-- "Đang theo dõi", "Đạt", "Chưa đạt", "Cảnh báo"
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE chi_so_qlcl ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users
CREATE POLICY "Allow all for authenticated users" ON chi_so_qlcl
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Index for common queries
CREATE INDEX idx_chi_so_qlcl_nhom ON chi_so_qlcl(nhom_chi_so);
CREATE INDEX idx_chi_so_qlcl_thang_nam ON chi_so_qlcl(thang_nam);

-- Sample data
INSERT INTO chi_so_qlcl (ten_chi_so, nhom_chi_so, don_vi_tinh, gia_tri, muc_tieu, gia_tri_max, thang_nam, xu_huong, mau_hien_thi, trang_thai) VALUES
('Tỷ lệ tai biến phẫu thuật', 'Chuyên môn & An toàn', '%', 0.5, 1, 5, '06/2024', 'giam', 'bg-green-500', 'Đạt'),
('Tỷ lệ nhiễm khuẩn bệnh viện', 'Chuyên môn & An toàn', '%', 2.1, 2.5, 5, '06/2024', 'tang', 'bg-primary-500', 'Đạt'),
('Tuân thủ quy trình kỹ thuật', 'Chuyên môn & An toàn', '%', 95, 98, 100, '06/2024', 'on_dinh', 'bg-indigo-500', 'Chưa đạt'),
('Tỷ lệ sử dụng kháng sinh dự phòng', 'Chuyên môn & An toàn', '%', 88, 90, 100, '06/2024', 'tang', 'bg-purple-500', 'Chưa đạt'),
('Tỷ lệ tiêm an toàn', 'Chuyên môn & An toàn', '%', 99.5, 100, 100, '06/2024', 'on_dinh', 'bg-teal-500', 'Đạt'),
('Tỷ lệ sự cố y khoa được báo cáo', 'Chuyên môn & An toàn', '%', 45, NULL, 100, '06/2024', 'tang', 'bg-orange-500', 'Đang theo dõi'),
('Hài lòng người bệnh Nội trú', 'Hài lòng & Quản lý', '%', 92.5, 90, 100, '06/2024', 'tang', 'bg-pink-500', 'Đạt'),
('Hài lòng người bệnh Ngoại trú', 'Hài lòng & Quản lý', '%', 88.2, 90, 100, '06/2024', 'on_dinh', 'bg-rose-500', 'Chưa đạt'),
('Hài lòng nhân viên y tế', 'Hài lòng & Quản lý', '%', 85.0, 85, 100, '06/2024', 'tang', 'bg-orange-500', 'Đạt'),
('Thời gian chờ khám trung bình', 'Hài lòng & Quản lý', 'phút', 35, 30, 60, '06/2024', 'giam', 'bg-cyan-500', 'Chưa đạt'),
('Công suất sử dụng giường bệnh', 'Hài lòng & Quản lý', '%', 98, 95, 100, '06/2024', 'on_dinh', 'bg-emerald-500', 'Đạt');
