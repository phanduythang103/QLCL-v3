-- Tạo bảng assessment_team_members (Thành viên tổ chấm điểm)
-- Dùng cho việc cấu hình các tổ đánh giá chất lượng
CREATE TABLE IF NOT EXISTS assessment_team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_name text NOT NULL,             -- Tên tổ (ví dụ: Tổ 1, Tổ Nội khoa, v.v.)
  user_id uuid REFERENCES users(id),    -- Link đến bảng users
  ho_ten text NOT NULL,                 -- Họ và tên (đồng bộ từ users)
  chuc_vu text,                        -- Chức vụ (đồng bộ từ users)
  don_vi text,                         -- Đơn vị / Khoa phòng (đồng bộ từ users)
  vai_tro text,                        -- Vai trò trong tổ (Trưởng đoàn, Thành viên, v.v.)
  ghi_chu text,                        -- Ghi chú thêm
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE assessment_team_members ENABLE ROW LEVEL SECURITY;

-- Policy: Cho phép tất cả thao tác CRUD
CREATE POLICY "assessment_team_members: Select all" ON assessment_team_members
  FOR SELECT USING (true);
CREATE POLICY "assessment_team_members: Insert" ON assessment_team_members
  FOR INSERT WITH CHECK (true);
CREATE POLICY "assessment_team_members: Update" ON assessment_team_members
  FOR UPDATE USING (true);
CREATE POLICY "assessment_team_members: Delete" ON assessment_team_members
  FOR DELETE USING (true);

-- Sample Data (Optional)
-- INSERT INTO assessment_team_members (team_name, ho_ten, vai_tro) VALUES ('Tổ 1', 'Nguyễn Văn A', 'Trưởng đoàn');
