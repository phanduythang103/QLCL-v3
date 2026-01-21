-- Tạo bảng dm_vai_tro_qlcl
CREATE TABLE dm_vai_tro_qlcl (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vai_tro text NOT NULL, -- Vai trò QLCL
  created_at timestamp with time zone DEFAULT now()
);

-- Policy: Cho phép tất cả thao tác CRUD
CREATE POLICY "dm_vai_tro_qlcl: Select all" ON dm_vai_tro_qlcl
  FOR SELECT USING (true);
CREATE POLICY "dm_vai_tro_qlcl: Insert" ON dm_vai_tro_qlcl
  FOR INSERT WITH CHECK (true);
CREATE POLICY "dm_vai_tro_qlcl: Update" ON dm_vai_tro_qlcl
  FOR UPDATE USING (true);
CREATE POLICY "dm_vai_tro_qlcl: Delete" ON dm_vai_tro_qlcl
  FOR DELETE USING (true);
