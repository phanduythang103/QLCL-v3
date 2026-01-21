-- Tạo bảng dm_chuc_vu
CREATE TABLE dm_chuc_vu (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ten_chuc_vu text NOT NULL, -- Tên chức vụ
  created_at timestamp with time zone DEFAULT now()
);

-- Policy: Cho phép tất cả thao tác CRUD
CREATE POLICY "dm_chuc_vu: Select all" ON dm_chuc_vu
  FOR SELECT USING (true);
CREATE POLICY "dm_chuc_vu: Insert" ON dm_chuc_vu
  FOR INSERT WITH CHECK (true);
CREATE POLICY "dm_chuc_vu: Update" ON dm_chuc_vu
  FOR UPDATE USING (true);
CREATE POLICY "dm_chuc_vu: Delete" ON dm_chuc_vu
  FOR DELETE USING (true);
