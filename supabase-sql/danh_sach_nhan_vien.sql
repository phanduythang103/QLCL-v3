-- Tạo bảng danh_sach_nhan_vien (Danh sách nhân viên dùng cho các bảng giám sát)
-- Cấu hình tại: Cài đặt > Danh sách nhân viên
CREATE TABLE IF NOT EXISTS danh_sach_nhan_vien (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  khoa_don_vi text,                 -- Khoa/Đơn vị (tự điền theo user, cho phép sửa)
  ho_ten text NOT NULL,             -- Họ và tên nhân viên
  doi_tuong text NOT NULL DEFAULT 'Điều dưỡng', -- Đối tượng: 'Điều dưỡng' | 'Bác sỹ'
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE danh_sach_nhan_vien ENABLE ROW LEVEL SECURITY;

-- Policy: Cho phép tất cả thao tác CRUD (đồng bộ với các bảng danh mục khác trong hệ thống)
CREATE POLICY "danh_sach_nhan_vien: Select all" ON danh_sach_nhan_vien
  FOR SELECT USING (true);
CREATE POLICY "danh_sach_nhan_vien: Insert" ON danh_sach_nhan_vien
  FOR INSERT WITH CHECK (true);
CREATE POLICY "danh_sach_nhan_vien: Update" ON danh_sach_nhan_vien
  FOR UPDATE USING (true);
CREATE POLICY "danh_sach_nhan_vien: Delete" ON danh_sach_nhan_vien
  FOR DELETE USING (true);

-- Chỉ mục hỗ trợ lọc theo đối tượng
CREATE INDEX IF NOT EXISTS idx_dsnv_doi_tuong ON danh_sach_nhan_vien (doi_tuong);
