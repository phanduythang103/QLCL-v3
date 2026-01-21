-- Tạo bảng nhan_su_qlcl (Nhân sự QLCL)
-- Dùng cho module Quản lý Nhân sự & Mạng lưới QLCL
CREATE TABLE IF NOT EXISTS nhan_su_qlcl (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ho_ten text NOT NULL,               -- Họ và tên
  cap_bac text,                        -- Cấp bậc (Đại tá, Thượng tá, Thiếu tá, v.v.)
  chuc_vu text,                        -- Chức vụ
  don_vi text,                         -- Đơn vị / Khoa phòng
  so_dien_thoai text,                  -- Số điện thoại
  email text,                          -- Email
  co_chung_chi boolean DEFAULT false,  -- Có chứng chỉ QLCL hay không
  vai_tro_qlcl text[] DEFAULT '{}',    -- Mảng vai trò QLCL: 'COUNCIL', 'BOARD', 'NETWORK'
  ghi_chu text,                        -- Ghi chú
  trang_thai text DEFAULT 'Hoạt động', -- Trạng thái: Hoạt động, Nghỉ việc
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE nhan_su_qlcl ENABLE ROW LEVEL SECURITY;

-- Policy: Cho phép tất cả thao tác CRUD
CREATE POLICY "nhan_su_qlcl: Select all" ON nhan_su_qlcl
  FOR SELECT USING (true);
CREATE POLICY "nhan_su_qlcl: Insert" ON nhan_su_qlcl
  FOR INSERT WITH CHECK (true);
CREATE POLICY "nhan_su_qlcl: Update" ON nhan_su_qlcl
  FOR UPDATE USING (true);
CREATE POLICY "nhan_su_qlcl: Delete" ON nhan_su_qlcl
  FOR DELETE USING (true);

-- Sample data
INSERT INTO nhan_su_qlcl (ho_ten, cap_bac, chuc_vu, don_vi, so_dien_thoai, co_chung_chi, vai_tro_qlcl) VALUES
('Nguyễn Văn A', 'Đại tá', 'Giám đốc', 'Ban Giám đốc', '0912.345.678', true, ARRAY['COUNCIL', 'BOARD']),
('Trần Thị B', 'Thượng tá', 'Trưởng khoa', 'Khoa Nội', '0912.345.679', true, ARRAY['BOARD']),
('Lê Văn C', 'Thiếu tá', 'Phó Trưởng khoa', 'Khoa Ngoại', '0912.345.680', false, ARRAY['NETWORK']);
