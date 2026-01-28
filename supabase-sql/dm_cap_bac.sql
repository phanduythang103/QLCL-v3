-- Tạo bảng danh mục cấp bậc
CREATE TABLE IF NOT EXISTS dm_cap_bac (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ten_cap_bac text UNIQUE NOT NULL,      -- Tên cấp bậc
  thu_tu int,                             -- Thứ tự hiển thị
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE dm_cap_bac ENABLE ROW LEVEL SECURITY;

-- Policies: Cho phép tất cả thao tác CRUD
CREATE POLICY "dm_cap_bac: Select all" ON dm_cap_bac
  FOR SELECT USING (true);

CREATE POLICY "dm_cap_bac: Insert" ON dm_cap_bac
  FOR INSERT WITH CHECK (true);

CREATE POLICY "dm_cap_bac: Update" ON dm_cap_bac
  FOR UPDATE USING (true);

CREATE POLICY "dm_cap_bac: Delete" ON dm_cap_bac
  FOR DELETE USING (true);

-- Thêm dữ liệu mẫu theo thứ tự cấp bậc quân đội
INSERT INTO dm_cap_bac (ten_cap_bac, thu_tu) VALUES
('Thiếu tướng', 1),
('Đại tá', 2),
('Thượng tá', 3),
('Trung tá', 4),
('Thiếu tá', 5),
('Đại úy', 6),
('Thượng úy', 7),
('Trung úy', 8),
('Thiếu úy', 9)
ON CONFLICT (ten_cap_bac) DO NOTHING;
