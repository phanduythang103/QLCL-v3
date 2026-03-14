-- Tạo bảng scyk_nghiem_trong (Sự cố y khoa nghiêm trọng)
CREATE TABLE scyk_nghiem_trong (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ma_scyk text NOT NULL,                             -- Mã SCYK
  ngay_bao_cao date NOT NULL,                        -- Ngày báo cáo
  nguoi_bao_cao text NOT NULL,                      -- Người báo cáo
  ngay_xay_ra date NOT NULL,                         -- Ngày xảy ra
  don_vi text NOT NULL,                             -- Đơn vị
  tom_tat_noi_dung_su_co text NOT NULL,             -- Tóm tắt nội dung sự cố
  phan_loai_nc3 text,                               -- Phân loại (NC3)
  hau_qua_doi_voi_nguoi_benh text,                  -- Hậu quả đối với người bệnh
  trang_thai_xu_ly text DEFAULT 'Đang RCA' 
    CHECK (trang_thai_xu_ly IN ('Đang RCA', 'Đã kết luận')), -- Trạng thái xử lý
  created_at timestamp with time zone DEFAULT now()
);

-- Policy: Cho phép tất cả thao tác CRUD (Full quyền cho Authenticated users)
-- Bật RLS
ALTER TABLE scyk_nghiem_trong ENABLE ROW LEVEL SECURITY;

-- Cho phép Select
CREATE POLICY "scyk_nghiem_trong: Select all" ON scyk_nghiem_trong
  FOR SELECT USING (true);

-- Cho phép Insert
CREATE POLICY "scyk_nghiem_trong: Insert" ON scyk_nghiem_trong
  FOR INSERT WITH CHECK (true);

-- Cho phép Update
CREATE POLICY "scyk_nghiem_trong: Update" ON scyk_nghiem_trong
  FOR UPDATE USING (true);

-- Cho phép Delete
CREATE POLICY "scyk_nghiem_trong: Delete" ON scyk_nghiem_trong
  FOR DELETE USING (true);

-- Comment mô tả bảng
COMMENT ON TABLE scyk_nghiem_trong IS 'Bảng lưu trữ thông tin sự cố y khoa nghiêm trọng';
