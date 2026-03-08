-- Bảng Báo cáo Tiến độ Cải tiến Chất lượng (Full Police/Policies)
CREATE TABLE IF NOT EXISTS bao_cao_tien_do_ctcl (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ngay_bao_cao date NOT NULL DEFAULT CURRENT_DATE,      -- Ngày báo cáo
  don_vi_bao_cao text NOT NULL,                          -- Đơn vị báo cáo
  nguoi_bao_cao text NOT NULL,                           -- Người báo cáo
  ky_bao_cao text NOT NULL,                              -- Kỳ báo cáo (Tháng/Quý/Năm)
  
  -- Liên kết với kế hoạch cải tiến
  ke_hoach_id uuid NOT NULL REFERENCES khctcl(id) ON DELETE CASCADE, -- Tên kế hoạch (ID)
  
  muc_tieu_de_ra text,                                   -- Mục tiêu đề ra
  ket_qua_hien_tai text,                                 -- Kết quả hiện tại
  hang_muc_hoan_thanh text,                              -- Hạng mục đã hoàn thành
  hang_muc_dang_thuc_hien text,                          -- Hạng mục đang thực hiện
  kho_khan text,                                         -- Khó khăn
  de_xuat text,                                          -- Đề xuất
  
  nguoi_tao_id uuid DEFAULT auth.uid(),                  -- ID người tạo
  created_at timestamp with time zone DEFAULT now()
);

-- Bật Row Level Security
ALTER TABLE bao_cao_tien_do_ctcl ENABLE ROW LEVEL SECURITY;

-- 1. Cho phép tất cả người dùng xem báo cáo
DROP POLICY IF EXISTS "bao_cao_tien_do_ctcl: Cho phép xem" ON bao_cao_tien_do_ctcl;
CREATE POLICY "bao_cao_tien_do_ctcl: Cho phép xem" ON bao_cao_tien_do_ctcl
  FOR SELECT USING (true);

-- 2. Cho phép thêm mới
DROP POLICY IF EXISTS "bao_cao_tien_do_ctcl: Cho phép thêm mới" ON bao_cao_tien_do_ctcl;
CREATE POLICY "bao_cao_tien_do_ctcl: Cho phép thêm mới" ON bao_cao_tien_do_ctcl
  FOR INSERT WITH CHECK (true);

-- 3. Cho phép cập nhật/xóa
DROP POLICY IF EXISTS "bao_cao_tien_do_ctcl: Cho phép sửa" ON bao_cao_tien_do_ctcl;
CREATE POLICY "bao_cao_tien_do_ctcl: Cho phép sửa" ON bao_cao_tien_do_ctcl
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "bao_cao_tien_do_ctcl: Cho phép xóa" ON bao_cao_tien_do_ctcl;
CREATE POLICY "bao_cao_tien_do_ctcl: Cho phép xóa" ON bao_cao_tien_do_ctcl
  FOR DELETE USING (true);

-- Chú thích bảng và cột
COMMENT ON TABLE bao_cao_tien_do_ctcl IS 'Bảng Báo cáo Tiến độ Cải tiến Chất lượng';
COMMENT ON COLUMN bao_cao_tien_do_ctcl.ke_hoach_id IS 'Liên kết tới bảng khctcl (Kế hoạch cải tiến)';
COMMENT ON COLUMN bao_cao_tien_do_ctcl.ky_bao_cao IS 'Kỳ báo cáo (ví dụ: Tháng 3/2024)';

-- Lưu ý kỹ thuật cho UI:
-- Khi hiển thị danh sách kế hoạch để chọn (ke_hoach_id):
-- SELECT * FROM khctcl WHERE don_vi = (SELECT department FROM users WHERE id = auth.uid())
-- Điều này đảm bảo người dùng chỉ chọn được kế hoạch của đơn vị mình.
