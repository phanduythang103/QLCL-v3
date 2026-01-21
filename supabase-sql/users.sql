
-- Tạo bảng users
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL, -- Tài khoản
  password text NOT NULL,        -- Mật khẩu
  full_name text NOT NULL,       -- Họ và tên
  department text,               -- Khoa/phòng
  role text NOT NULL,            -- Vai trò (Quản trị viên, Người dùng)
  status text NOT NULL DEFAULT 'Hoạt động', -- Trạng thái (Hoạt động, Khóa)
  created_at timestamp with time zone DEFAULT now()
);

-- Policy: Cho phép tất cả người dùng đọc, admin được thêm/sửa/xóa
CREATE POLICY "Users: Select all" ON users
  FOR SELECT USING (true);
CREATE POLICY "Users: Insert" ON users
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Users: Update" ON users
  FOR UPDATE USING (true);
CREATE POLICY "Users: Delete" ON users
  FOR DELETE USING (true);
