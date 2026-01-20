-- Tạo bảng lich_giam_sat
CREATE TABLE lich_giam_sat (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tu_ngay date NOT NULL,           -- Từ ngày
  den_ngay date NOT NULL,          -- Đến ngày
  nd_giam_sat text NOT NULL,       -- Nội dung giám sát
  nhan_vien_gs text NOT NULL,      -- Nhân viên giám sát
  dv_duoc_gs text NOT NULL,        -- Đơn vị được giám sát
  trang_thai text NOT NULL,        -- Trạng thái
  created_at timestamp with time zone DEFAULT now()
);

-- Policy: Cho phép tất cả người dùng đọc, chỉ owner được sửa/xóa
CREATE POLICY "lich_giam_sat: Select all" ON lich_giam_sat
  FOR SELECT USING (true);
CREATE POLICY "lich_giam_sat: Insert" ON lich_giam_sat
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "lich_giam_sat: Update" ON lich_giam_sat
  FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "lich_giam_sat: Delete" ON lich_giam_sat
  FOR DELETE USING (auth.uid() IS NOT NULL);
