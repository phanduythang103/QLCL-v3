-- Tạo bảng co_quan_ban_hanh
CREATE TABLE co_quan_ban_hanh (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ten_co_quan text NOT NULL, -- Tên cơ quan ban hành
  created_at timestamp with time zone DEFAULT now()
);

-- Policy: Cho phép tất cả thao tác CRUD
CREATE POLICY "co_quan_ban_hanh: Select all" ON co_quan_ban_hanh
  FOR SELECT USING (true);
CREATE POLICY "co_quan_ban_hanh: Insert" ON co_quan_ban_hanh
  FOR INSERT WITH CHECK (true);
CREATE POLICY "co_quan_ban_hanh: Update" ON co_quan_ban_hanh
  FOR UPDATE USING (true);
CREATE POLICY "co_quan_ban_hanh: Delete" ON co_quan_ban_hanh
  FOR DELETE USING (true);
