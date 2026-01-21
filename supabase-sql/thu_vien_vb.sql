-- Tạo bảng thu_vien_vb (Thư viện văn bản)
-- Dùng cho module Văn bản - Đào tạo - Thư viện
CREATE TABLE thu_vien_vb (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  so_hieu_vb text NOT NULL,           -- Số hiệu văn bản
  ten_vb text NOT NULL,               -- Tên văn bản
  loai_vb text,                       -- Loại văn bản (Luật, Nghị định, Thông tư, Quyết định, Quy trình...)
  linh_vuc text,                      -- Lĩnh vực (QLCL, An toàn người bệnh, KSNK, JCI...)
  phan_loai text,                     -- Phân loại: LEGAL, MOH, HOSPITAL, SOP, INTL
  co_quan_ban_hanh text,              -- Cơ quan ban hành
  ngay_hieu_luc date,                 -- Ngày có hiệu lực
  tieu_chi_lien_quan text,            -- Tiêu chí liên quan (VD: A1.1, D2.1)
  trang_thai text DEFAULT 'Còn hiệu lực', -- Trạng thái: Còn hiệu lực, Hết hiệu lực
  file_dinh_kem text,                 -- File đính kèm (đường dẫn hoặc URL)
  ghi_chu text,                       -- Ghi chú
  created_at timestamp with time zone DEFAULT now()
);

-- Policy: Cho phép tất cả thao tác CRUD
CREATE POLICY "thu_vien_vb: Select all" ON thu_vien_vb
  FOR SELECT USING (true);
CREATE POLICY "thu_vien_vb: Insert" ON thu_vien_vb
  FOR INSERT WITH CHECK (true);
CREATE POLICY "thu_vien_vb: Update" ON thu_vien_vb
  FOR UPDATE USING (true);
CREATE POLICY "thu_vien_vb: Delete" ON thu_vien_vb
  FOR DELETE USING (true);
