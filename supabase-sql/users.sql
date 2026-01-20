
-- Tạo bảng users
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL, -- Tài khoản
  full_name text NOT NULL,       -- Họ và tên
  department text,               -- Khoa/phòng
  role text NOT NULL,            -- Vai trò (Quản trị viên, Người dùng)
  status text NOT NULL DEFAULT 'Hoạt động', -- Trạng thái (Hoạt động, Khóa)
  created_at timestamp with time zone DEFAULT now()
);

-- Policy: Chỉ cho phép owner truy cập dữ liệu của mình
CREATE POLICY "Users: Select own" ON users
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users: Insert own" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users: Update own" ON users
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users: Delete own" ON users
  FOR DELETE USING (auth.uid() = id);
