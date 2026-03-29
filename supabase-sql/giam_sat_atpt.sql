-- Bảng giám sát An toàn Phẫu thuật (Surgical Safety Checklist)
-- Dựa trên bảng kiểm an toàn phẫu thuật của WHO

CREATE TABLE IF NOT EXISTS public.giam_sat_atpt (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ngay_giam_sat DATE NOT NULL DEFAULT CURRENT_DATE,
    nguoi_giam_sat TEXT NOT NULL, -- Theo user đăng nhập
    ban_mo_so TEXT,
    khoa_phau_thuat TEXT,
    ho_ten_nguoi_benh TEXT NOT NULL,
    kip_phau_thuat TEXT,
    
    -- GIAI ĐOẠN 1: TRƯỚC GÂY MÊ (SIGN IN)
    tc1_xac_nhan_danh_tinh BOOLEAN DEFAULT FALSE,
    tc2_xac_nhan_vi_tri BOOLEAN DEFAULT FALSE,
    tc3_cam_ket_phau_thuat BOOLEAN DEFAULT FALSE,
    tc4_kiem_tra_thiet_bi BOOLEAN DEFAULT FALSE,
    tc5_danh_gia_nguy_co BOOLEAN DEFAULT FALSE,
    
    -- GIAI ĐOẠN 2: TRƯỚC RẠCH DA (TIME OUT)
    tc6_gioi_thieu_nhan_su BOOLEAN DEFAULT FALSE,
    tc7_xac_nhan_lan_cuoi BOOLEAN DEFAULT FALSE,
    tc8_du_phong_nhiem_khuan BOOLEAN DEFAULT FALSE,
    tc9_cac_van_de_phat_sinh BOOLEAN DEFAULT FALSE,
    
    -- GIAI ĐOẠN 3: TRƯỚC KHI RỜI PHÒNG MỔ (SIGN OUT)
    tc10_kiem_dem_dung_cu BOOLEAN DEFAULT FALSE,
    tc11_mau_benh_pham BOOLEAN DEFAULT FALSE,
    tc12_ghi_chep_ho_so BOOLEAN DEFAULT FALSE,
    tc13_ban_giao_hoi_tinh BOOLEAN DEFAULT FALSE,
    
    -- Tổng hợp
    tong_dat INTEGER DEFAULT 0,
    ty_le_tuan_thu NUMERIC(5, 2) DEFAULT 0, -- (Số tiêu chí Đạt / 13) * 100
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index để tìm kiếm nhanh
CREATE INDEX IF NOT EXISTS idx_giam_sat_atpt_ngay ON public.giam_sat_atpt(ngay_giam_sat);
CREATE INDEX IF NOT EXISTS idx_giam_sat_atpt_nb ON public.giam_sat_atpt(ho_ten_nguoi_benh);

-- Comment cho các cột
COMMENT ON TABLE public.giam_sat_atpt IS 'Bảng giám sát An toàn Phẫu thuật (Surgical Safety Checklist)';

COMMENT ON COLUMN public.giam_sat_atpt.tc1_xac_nhan_danh_tinh IS '1. Xác nhận danh tính người bệnh: Họ tên, ngày sinh, mã số người bệnh. (Bác sĩ gây mê, Điều dưỡng, Người bệnh)';
COMMENT ON COLUMN public.giam_sat_atpt.tc2_xac_nhan_vi_tri IS '2. Xác nhận vị trí phẫu thuật: Đã được đánh dấu bằng mũi tên hướng vào vùng mổ (không dùng dấu X). (Phẫu thuật viên chính)';
COMMENT ON COLUMN public.giam_sat_atpt.tc3_cam_ket_phau_thuat IS '3. Cam kết phẫu thuật: Đã ký đủ chữ ký của phẫu thuật viên, BS gây mê và người bệnh/người đại diện. (Điều dưỡng dụng cụ)';
COMMENT ON COLUMN public.giam_sat_atpt.tc4_kiem_tra_thiet_bi IS '4. Kiểm tra thiết bị & thuốc: Máy mê, máy theo dõi, nguồn oxy dự phòng, thuốc cấp cứu. (Bác sĩ gây mê)';
COMMENT ON COLUMN public.giam_sat_atpt.tc5_danh_gia_nguy_co IS '5. Đánh giá nguy cơ: Kiểm soát đường thở, nguy cơ mất máu (>500ml), tiền sử dị ứng thuốc. (Bác sĩ gây mê)';

COMMENT ON COLUMN public.giam_sat_atpt.tc6_gioi_thieu_nhan_su IS '6. Giới thiệu nhân sự: Từng thành viên trong ê-kíp giới thiệu tên và vai trò. (Cả kíp phẫu thuật)';
COMMENT ON COLUMN public.giam_sat_atpt.tc7_xac_nhan_lan_cuoi IS '7. Xác nhận lại lần cuối: Đúng người bệnh, đúng vị trí và đúng phương pháp phẫu thuật (Phẫu thuật viên chính)';
COMMENT ON COLUMN public.giam_sat_atpt.tc8_du_phong_nhiem_khuan IS '8. Dự phòng nhiễm khuẩn: Đã tiêm kháng sinh dự phòng trong vòng 60 phút trước đó (nếu có chỉ định). (Bác sĩ gây mê)';
COMMENT ON COLUMN public.giam_sat_atpt.tc9_cac_van_de_phat_sinh IS '9. Các vấn đề phát sinh: Phẫu thuật viên, bác sĩ gây mê và điều dưỡng trao đổi về các nguy cơ đột biến có thể xảy ra. (Cả kíp phẫu thuật)';

COMMENT ON COLUMN public.giam_sat_atpt.tc10_kiem_dem_dung_cu IS '10. Kiểm đếm dụng cụ: Xác nhận đã kiểm đếm đủ gạc, dụng cụ phẫu thuật, vật tư tiêu hao. (Điều dưỡng dụng cụ)';
COMMENT ON COLUMN public.giam_sat_atpt.tc11_mau_benh_pham IS '11. Mẫu bệnh phẩm: Đã dán nhãn chính xác thông tin người bệnh và loại bệnh phẩm. (Phẫu thuật viên)';
COMMENT ON COLUMN public.giam_sat_atpt.tc12_ghi_chep_ho_so IS '12. Ghi chép hồ sơ: Hoàn thiện biên bản phẫu thuật, các tai biến phát sinh (nếu có). (Phẫu thuật viên)';
COMMENT ON COLUMN public.giam_sat_atpt.tc13_ban_giao_hoi_tinh IS '13. Bàn giao hồi tỉnh: Các lưu ý đặc biệt về chăm sóc và theo dõi sau mổ. (Bác sĩ gây mê)';

-- Trigger cập nhật updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_giam_sat_atpt_updated_at ON public.giam_sat_atpt;
CREATE TRIGGER update_giam_sat_atpt_updated_at
BEFORE UPDATE ON public.giam_sat_atpt
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE public.giam_sat_atpt ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Enable read access for all" ON public.giam_sat_atpt
    FOR SELECT TO public USING (true);

CREATE POLICY "Enable insert for all" ON public.giam_sat_atpt
    FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Enable update for all" ON public.giam_sat_atpt
    FOR UPDATE TO public USING (true);

CREATE POLICY "Enable delete for all" ON public.giam_sat_atpt
    FOR DELETE TO public USING (true);
