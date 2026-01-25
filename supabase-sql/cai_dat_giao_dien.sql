-- Tạo bảng cai_dat_giao_dien (Cài đặt giao diện đăng nhập)
CREATE TABLE IF NOT EXISTS cai_dat_giao_dien (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  anh text NOT NULL,                    -- Đường dẫn ảnh trong storage bucket 'avatar'
  tieu_de_chinh text NOT NULL,          -- Tiêu đề chính (VD: "Quản lý Chất lượng Bệnh viện")
  tieu_de_phu text,                     -- Tiêu đề phụ (VD: "Đăng nhập")
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE cai_dat_giao_dien ENABLE ROW LEVEL SECURITY;

-- Policy: Cho phép tất cả người dùng đọc
CREATE POLICY "cai_dat_giao_dien: Select all" ON cai_dat_giao_dien
  FOR SELECT USING (true);

-- Policy: Chỉ admin được thêm/sửa/xóa
CREATE POLICY "cai_dat_giao_dien: Insert" ON cai_dat_giao_dien
  FOR INSERT WITH CHECK (true);

CREATE POLICY "cai_dat_giao_dien: Update" ON cai_dat_giao_dien
  FOR UPDATE USING (true);

CREATE POLICY "cai_dat_giao_dien: Delete" ON cai_dat_giao_dien
  FOR DELETE USING (true);

-- Insert dữ liệu mẫu
INSERT INTO cai_dat_giao_dien (anh, tieu_de_chinh, tieu_de_phu) VALUES
('hospital-lobby.jpg', 'Quản lý Chất lượng Bệnh viện', 'Đăng nhập');

-- Tạo function để tự động cập nhật updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Tạo trigger
CREATE TRIGGER update_cai_dat_giao_dien_updated_at 
  BEFORE UPDATE ON cai_dat_giao_dien 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
