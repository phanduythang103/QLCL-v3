-- Tạo bảng thu_vien_video (Thư viện Video đào tạo)
CREATE TABLE thu_vien_video (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tieu_de text NOT NULL,        -- Tiêu đề video
  mo_ta text,                   -- Mô tả nội dung
  thoi_luong text,              -- Thời lượng (VD: 15:30)
  tac_gia text,                 -- Tác giả/Đơn vị sản xuất
  loai text,                    -- Loại video (Quy trình, Đào tạo, Tham khảo...)
  file_video text,              -- File video (đường dẫn hoặc URL)
  thumbnail text,               -- Ảnh thumbnail
  luot_xem integer DEFAULT 0,   -- Số lượt xem
  created_at timestamp with time zone DEFAULT now()
);

-- Policy: Cho phép tất cả thao tác CRUD
CREATE POLICY "thu_vien_video: Select all" ON thu_vien_video
  FOR SELECT USING (true);
CREATE POLICY "thu_vien_video: Insert" ON thu_vien_video
  FOR INSERT WITH CHECK (true);
CREATE POLICY "thu_vien_video: Update" ON thu_vien_video
  FOR UPDATE USING (true);
CREATE POLICY "thu_vien_video: Delete" ON thu_vien_video
  FOR DELETE USING (true);
