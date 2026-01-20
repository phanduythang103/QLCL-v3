-- Tạo bảng dm_don_vi (Danh mục đơn vị)
CREATE TABLE dm_don_vi (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ma_don_vi text UNIQUE NOT NULL,      -- Mã đơn vị
  ten_don_vi text NOT NULL,            -- Tên đơn vị
  khoi text NOT NULL,                  -- Khối
  created_at timestamp with time zone DEFAULT now()
);

-- Policy: Cho phép tất cả người dùng đọc, chỉ owner được sửa/xóa
CREATE POLICY "dm_don_vi: Select all" ON dm_don_vi
  FOR SELECT USING (true);
CREATE POLICY "dm_don_vi: Insert" ON dm_don_vi
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "dm_don_vi: Update" ON dm_don_vi
  FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "dm_don_vi: Delete" ON dm_don_vi
  FOR DELETE USING (auth.uid() IS NOT NULL);
