-- Tạo bảng bao_cao_scyk
CREATE TABLE bao_cao_scyk (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hinh_thuc_bao_cao text NOT NULL,           -- Hình thức báo cáo (Tự nguyện/Bắt buộc)
  so_bc_ma_scyk text NOT NULL,               -- Số BC/Mã SCYK
  ngay_bao_cao date NOT NULL,                -- Ngày báo cáo (date)
  don_vi_bao_cao text NOT NULL,              -- Đơn vị báo cáo
  ho_ten_nb text NOT NULL,                   -- Họ tên người báo cáo
  so_benh_an text,                           -- Số bệnh án
  ngay_sinh date,                            -- Ngày sinh
  gioi text,                                 -- Giới (Nam/Nữ)
  khoa_phong text,                           -- Khoa/phòng
  doi_tuong_xay_ra_sc text,                  -- Đối tượng xảy ra SC (checkbox)
  noi_xay_ra_sc text,                        -- Nơi xảy ra SC
  vi_tri_cu_the text,                        -- Vị trí cụ thể
  ngay_xay_ra_sc date,                       -- Ngày xảy ra SC
  thoi_gian text,                            -- Thời gian
  mo_ta_su_co text,                          -- Mô tả sự cố
  de_xuat_giai_phap_ban_dau text,            -- Đề xuất giải pháp ban đầu
  dieu_tri_xy_ly_ban_dau_da_thuc_hien text,  -- Điều trị/xử lý ban đầu đã thực hiện
  thong_bao_bs_npt text,                     -- Thông báo BS/NPT (checkbox)
  ghi_nhan_vao_hsba text,                    -- Ghi nhận vào HSBA (checkbox)
  thong_bao_nn text,                         -- Thông báo người nhà (checkbox)
  thong_bao_nb text,                         -- Thông báo người bệnh (checkbox)
  phan_loai_sc text,                         -- Phân loại SC (checkbox)
  phan_loai_ban_dau text,                    -- Phân loại ban đầu (checkbox)
  ho_ten_nguoi_bc text,                      -- Họ tên người báo cáo
  sdt text,                                  -- Số điện thoại
  email text,                                -- Email
  dieu_duong text,                           -- Điều dưỡng
  bac_sy text,                               -- Bác sỹ
  nb_nn text,                                -- Người bệnh/Người nhà (checkbox)
  chung_kien1 text,                          -- Chứng kiến 1
  chung_kien2 text,                          -- Chứng kiến 2
  created_at timestamp with time zone DEFAULT now()
);

-- Policy: Cho phép tất cả người dùng đọc, chỉ owner được sửa/xóa
CREATE POLICY "bao_cao_scyk: Select all" ON bao_cao_scyk
  FOR SELECT USING (true);
CREATE POLICY "bao_cao_scyk: Insert" ON bao_cao_scyk
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "bao_cao_scyk: Update" ON bao_cao_scyk
  FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "bao_cao_scyk: Delete" ON bao_cao_scyk
  FOR DELETE USING (auth.uid() IS NOT NULL);
