
-- Tạo bảng users
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL, -- Tài khoản
  password text NOT NULL,        -- Mật khẩu
  full_name text NOT NULL,       -- Họ và tên
  department text,               -- Khoa/phòng
  role text NOT NULL,            -- Vai trò (Quản trị viên, Người dùng)
  status text NOT NULL DEFAULT 'Hoạt động', -- Trạng thái (Hoạt động, Khóa)
  category text DEFAULT 'Nhân viên', -- Đối tượng (Mạng lưới, Tổ chấm điểm, Quản trị, Nhân viên)
  notes text,                    -- Ghi chú
  created_at timestamp with time zone DEFAULT now()
);

-- Cập nhật cho bảng hiện tại (nếu đã có bảng)
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS category text DEFAULT 'Nhân viên';
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS notes text;

-- Policy: Cho phép tất cả người dùng đọc, admin được thêm/sửa/xóa
CREATE POLICY "Users: Select all" ON users
  FOR SELECT USING (true);
CREATE POLICY "Users: Insert" ON users
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Users: Update" ON users
  FOR UPDATE USING (true);
CREATE POLICY "Users: Delete" ON users
  FOR DELETE USING (true);
