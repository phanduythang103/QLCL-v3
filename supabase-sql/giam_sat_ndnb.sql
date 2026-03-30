-- ============================================================
-- Bảng giám sát NHẬN DIỆN NGƯỜI BỆNH (NDNB)
-- Patient Identification Monitoring Checklist
-- 7 tiêu chí đánh giá tuân thủ nhận diện người bệnh
-- ============================================================

CREATE TABLE IF NOT EXISTS giam_sat_ndnb (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Thông tin chung
    ngay_giam_sat DATE NOT NULL DEFAULT CURRENT_DATE,
    nguoi_giam_sat TEXT NOT NULL,
    khoa_duoc_giam_sat TEXT NOT NULL,          -- Khoa được giám sát (từ bảng đơn vị hoặc nhập mới)
    doi_tuong_giam_sat TEXT NOT NULL,          -- Đối tượng được giám sát (tên điều dưỡng/bác sĩ)
    
    -- Nội dung kiểm tra (true = Đạt, false = Không đạt, null = Chưa đánh giá)
    -- 1. Sử dụng ít nhất 02 thông tin để nhận diện
    c1_nhan_dien_2_thong_tin BOOLEAN DEFAULT true,
    c1_ghi_chu TEXT,
    
    -- 2. Hình thức đặt câu hỏi mở
    c2_cau_hoi_mo BOOLEAN DEFAULT true,
    c2_ghi_chu TEXT,
    
    -- 3. Kiểm tra thông tin trên vòng nhận diện
    c3_vong_nhan_dien BOOLEAN DEFAULT true,
    c3_ghi_chu TEXT,
    
    -- 4. Đối chiếu với hồ sơ/y lệnh
    c4_doi_chieu_ho_so BOOLEAN DEFAULT true,
    c4_ghi_chu TEXT,
    
    -- 5. Xác nhận qua người thân (nếu cần)
    c5_xac_nhan_nguoi_than BOOLEAN DEFAULT true,
    c5_ghi_chu TEXT,
    
    -- 6. Dán nhãn bệnh phẩm tại giường
    c6_dan_nhan_benh_pham BOOLEAN DEFAULT true,
    c6_ghi_chu TEXT,
    
    -- 7. Bàn giao người bệnh
    c7_ban_giao_nguoi_benh BOOLEAN DEFAULT true,
    c7_ghi_chu TEXT,
    
    -- Kết quả tổng hợp
    tong_dat INTEGER DEFAULT 7,
    tong_tieu_chi INTEGER DEFAULT 7,
    ty_le_tuan_thu NUMERIC(5,2) DEFAULT 100.00,   -- Tỷ lệ % tuân thủ
    
    -- Nhận xét / Đề xuất cải tiến
    nhan_xet TEXT,
    
    -- Hình ảnh minh chứng (mảng URL từ storage)
    hinh_anh_minh_chung TEXT[] DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index để tìm kiếm nhanh
CREATE INDEX IF NOT EXISTS idx_giam_sat_ndnb_ngay ON giam_sat_ndnb(ngay_giam_sat);
CREATE INDEX IF NOT EXISTS idx_giam_sat_ndnb_khoa ON giam_sat_ndnb(khoa_duoc_giam_sat);

-- Trigger cập nhật updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_giam_sat_ndnb_updated_at
BEFORE UPDATE ON giam_sat_ndnb
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Comments cho các cột
COMMENT ON COLUMN giam_sat_ndnb.c1_nhan_dien_2_thong_tin IS '1. Sử dụng ít nhất 02 thông tin để nhận diện: Họ tên và Ngày tháng năm sinh (hoặc mã số người bệnh). Tuyệt đối không dùng số giường/số phòng.';
COMMENT ON COLUMN giam_sat_ndnb.c2_cau_hoi_mo IS '2. Hình thức đặt câu hỏi mở: Yêu cầu người bệnh tự nói họ tên và ngày sinh. Không hỏi câu hỏi Có/Không.';
COMMENT ON COLUMN giam_sat_ndnb.c3_vong_nhan_dien IS '3. Kiểm tra thông tin trên vòng nhận diện: Đối chiếu thông tin người bệnh trả lời với thông tin ghi trên vòng đeo tay (đối với bệnh nhân nội trú).';
COMMENT ON COLUMN giam_sat_ndnb.c4_doi_chieu_ho_so IS '4. Đối chiếu với hồ sơ/y lệnh: Đối chiếu thông tin người bệnh với bệnh án, phiếu chỉ định hoặc phiếu truyền dịch trước khi thực hiện.';
COMMENT ON COLUMN giam_sat_ndnb.c5_xac_nhan_nguoi_than IS '5. Xác nhận qua người thân (nếu cần): Trường hợp người bệnh hôn mê, trẻ nhỏ hoặc không thể trả lời, phải xác nhận thông tin qua người nhà hoặc người giám hộ.';
COMMENT ON COLUMN giam_sat_ndnb.c6_dan_nhan_benh_pham IS '6. Dán nhãn bệnh phẩm tại giường: Các mẫu máu, bệnh phẩm phải được dán nhãn ngay sau khi lấy tại giường bệnh và có đủ thông tin nhận diện.';
COMMENT ON COLUMN giam_sat_ndnb.c7_ban_giao_nguoi_benh IS '7. Bàn giao người bệnh: Thực hiện xác nhận đúng danh tính khi chuyển người bệnh giữa các khoa hoặc bàn giao giữa các ca trực.';

-- Enable RLS
ALTER TABLE giam_sat_ndnb ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations for all public users
CREATE POLICY "Allow all operations on giam_sat_ndnb" ON giam_sat_ndnb
    FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);
