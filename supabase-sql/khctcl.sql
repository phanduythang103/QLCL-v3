-- Tạo bảng khctcl (Kế hoạch Cải tiến Chất lượng)
CREATE TABLE khctcl (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ngay_lap_ke_hoach date NOT NULL DEFAULT CURRENT_DATE, -- Ngày lập kế hoạch
  don_vi text NOT NULL,                                 -- Đơn vị
  nguoi_lap_ke_hoach text NOT NULL,                      -- Người lập kế hoạch
  ten_van_de text NOT NULL,                              -- Tên vấn đề
  ly_do_thuc_hien text,                                  -- Lý do thực hiện (Đặt vấn đề)
  muc_tieu text,                                         -- Mục tiêu (SMART)
  
  ngay_bat_dau date,                                    -- Thời gian thực hiện từ ngày
  ngay_ket_thuc date,                                   -- Thời gian thực hiện đến ngày
  trang_thai text NOT NULL DEFAULT 'Dự thảo',           -- Trạng thái kế hoạch
  
  -- Giải pháp tổ chức: Lưu dưới dạng mảng JSONB các đối tượng 
  -- [{tt, hanh_dong, nguoi_phu_trach, thoi_han, ket_qua}]
  giai_phap_to_chuc jsonb DEFAULT '[]'::jsonb,           -- Giải pháp tổ chức
  
  nguoi_tao_id uuid DEFAULT auth.uid(),                  -- ID người tạo (nếu có đăng nhập)
  created_at timestamp with time zone DEFAULT now()
);

-- Bật Row Level Security (RLS)
ALTER TABLE khctcl ENABLE ROW LEVEL SECURITY;

-- Policy: Cho phép xem (SELECT)
CREATE POLICY "khctcl: Cho phép xem" ON khctcl
  FOR SELECT USING (true);

-- Policy: Cho phép thêm mới (INSERT)
CREATE POLICY "khctcl: Cho phép thêm mới" ON khctcl
  FOR INSERT WITH CHECK (true);

-- Policy: Cho phép cập nhật (UPDATE)
CREATE POLICY "khctcl: Cho phép cập nhật" ON khctcl
  FOR UPDATE USING (true);

-- Policy: Cho phép xóa (DELETE)
CREATE POLICY "khctcl: Cho phép xóa" ON khctcl
  FOR DELETE USING (true);

-- Chú thích cho các cột để dễ quản lý trong Supabase
COMMENT ON TABLE khctcl IS 'Bảng Kế hoạch Cải tiến Chất lượng';
COMMENT ON COLUMN khctcl.giai_phap_to_chuc IS 'Mảng chứa các giải pháp: [{tt, hanh_dong, nguoi_phu_trach, thoi_han, ket_qua}]';

-- MIGRATION: Chạy bộ lệnh này nếu bảng đã tồn tại để bổ sung cột mới
-- ALTER TABLE khctcl ADD COLUMN IF NOT EXISTS ngay_bat_dau date;
-- ALTER TABLE khctcl ADD COLUMN IF NOT EXISTS ngay_ket_thuc date;
-- ALTER TABLE khctcl ADD COLUMN IF NOT EXISTS trang_thai text NOT NULL DEFAULT 'Dự thảo';
