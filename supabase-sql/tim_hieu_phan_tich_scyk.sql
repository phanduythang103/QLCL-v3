-- Tạo bảng tim_hieu_phan_tich_scyk
CREATE TABLE tim_hieu_phan_tich_scyk (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  a_danh_cho_nv_chuyen_trach text,           -- Dành cho NV chuyên trách
  i_mo_ta_chi_tiet text,                     -- Mô tả chi tiết
  ii_phan_loai_theo_nhom text,               -- Phân loại theo nhóm (checkbox, lưu dạng text hoặc json)
  iii_dieu_tri_da_thuc_hien text,            -- Điều trị đã thực hiện
  iiii_phan_loai_theo_nhom_nguyen_nhan text, -- Phân loại theo nhóm nguyên nhân (checkbox, lưu dạng text hoặc json)
  iiiii_hanh_dong_khac_phuc text,            -- Hành động khắc phục
  iiiiii_de_xuat_khuyen_cao text,            -- Đề xuất/khuyến cáo
  b_danh_cho_cap_quan_ly text,               -- Dành cho cấp quản lý
  b_i_danh_gia text,                         -- Đánh giá
  da_thao_luan text,                         -- Đã thảo luận (checkbox)
  phu_hop_voi_cac_khuyen_cao text,           -- Phù hợp với các khuyến cáo (checkbox)
  b_ii_danh_gia_muc_do_ton_thuong text,      -- Đánh giá mức độ tổn thương
  tren_nguoi_benh text,                      -- Trên người bệnh
  tren_to_chuc text,                         -- Trên tổ chức
  muc_do_nc text,                            -- Mức độ NC (NC0, NC1, NC2, NC3)
  muc_do_chi_tiet text,                      -- Chi tiết mức độ tổn thương (checkbox, lưu dạng text hoặc json)
  ten text,                                  -- Tên
  ky_ten text,                               -- Ký tên
  chuc_danh text,                            -- Chức danh
  ngay date,                                 -- Ngày
  gio text,                                  -- Giờ
  created_at timestamp with time zone DEFAULT now()
);

-- Policy: Cho phép tất cả thao tác CRUD
CREATE POLICY "tim_hieu_phan_tich_scyk: Select all" ON tim_hieu_phan_tich_scyk
  FOR SELECT USING (true);
CREATE POLICY "tim_hieu_phan_tich_scyk: Insert" ON tim_hieu_phan_tich_scyk
  FOR INSERT WITH CHECK (true);
CREATE POLICY "tim_hieu_phan_tich_scyk: Update" ON tim_hieu_phan_tich_scyk
  FOR UPDATE USING (true);
CREATE POLICY "tim_hieu_phan_tich_scyk: Delete" ON tim_hieu_phan_tich_scyk
  FOR DELETE USING (true);
