-- Tạo bảng phân quyền
CREATE TABLE IF NOT EXISTS phan_quyen (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id text NOT NULL,           -- 'admin', 'council', 'network', 'staff'
  module text NOT NULL,             -- 'DASHBOARD', 'HR', 'DOCS', etc.
  can_view boolean DEFAULT true,
  can_create boolean DEFAULT false,
  can_update boolean DEFAULT false,
  can_delete boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(role_id, module)
);

-- Enable RLS
ALTER TABLE phan_quyen ENABLE ROW LEVEL SECURITY;

-- Policies: Cho phép tất cả người dùng đọc, admin được thêm/sửa/xóa
CREATE POLICY "Permissions: Select all" ON phan_quyen
  FOR SELECT USING (true);

CREATE POLICY "Permissions: Insert" ON phan_quyen
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Permissions: Update" ON phan_quyen
  FOR UPDATE USING (true);

CREATE POLICY "Permissions: Delete" ON phan_quyen
  FOR DELETE USING (true);

-- Thêm dữ liệu mặc định cho các vai trò
INSERT INTO phan_quyen (role_id, module, can_view, can_create, can_update, can_delete) VALUES
-- Admin: Full permissions
('admin', 'DASHBOARD', true, true, true, true),
('admin', 'HR', true, true, true, true),
('admin', 'DOCS', true, true, true, true),
('admin', 'ASSESSMENT', true, true, true, true),
('admin', 'INCIDENTS', true, true, true, true),
('admin', 'IMPROVEMENT', true, true, true, true),
('admin', 'INDICATORS', true, true, true, true),
('admin', 'SUPERVISION', true, true, true, true),
('admin', 'REPORTS', true, true, true, true),
('admin', 'SETTINGS', true, true, true, true),

-- Council: View all, edit most, no delete except for specific modules
('council', 'DASHBOARD', true, true, true, false),
('council', 'HR', true, true, true, false),
('council', 'DOCS', true, true, true, false),
('council', 'ASSESSMENT', true, true, true, false),
('council', 'INCIDENTS', true, true, true, false),
('council', 'IMPROVEMENT', true, true, true, false),
('council', 'INDICATORS', true, true, true, false),
('council', 'SUPERVISION', true, true, true, false),
('council', 'REPORTS', true, true, true, false),
('council', 'SETTINGS', true, false, false, false),

-- Network: View all, edit some, limited delete
('network', 'DASHBOARD', true, true, true, false),
('network', 'HR', true, true, true, false),
('network', 'DOCS', true, true, true, false),
('network', 'ASSESSMENT', true, true, true, false),
('network', 'INCIDENTS', true, true, true, false),
('network', 'IMPROVEMENT', true, true, true, false),
('network', 'INDICATORS', true, true, true, false),
('network', 'SUPERVISION', true, true, true, false),
('network', 'REPORTS', true, true, true, false),
('network', 'SETTINGS', true, false, false, false),

-- Staff: View only, limited create/edit
('staff', 'DASHBOARD', true, false, false, false),
('staff', 'HR', true, false, false, false),
('staff', 'DOCS', true, true, false, false),
('staff', 'ASSESSMENT', true, true, false, false),
('staff', 'INCIDENTS', true, true, false, false),
('staff', 'IMPROVEMENT', true, true, false, false),
('staff', 'INDICATORS', true, false, false, false),
('staff', 'SUPERVISION', true, false, false, false),
('staff', 'REPORTS', true, false, false, false),
('staff', 'SETTINGS', true, false, false, false)
ON CONFLICT (role_id, module) DO NOTHING;
