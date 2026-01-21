-- Tạo bảng ke_hoach_cai_tien (Kế hoạch cải tiến chất lượng - PDCA)
CREATE TABLE ke_hoach_cai_tien (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tieu_de text NOT NULL,              -- Tiêu đề đề án
  don_vi text NOT NULL,               -- Đơn vị thực hiện
  trang_thai text DEFAULT 'Lập kế hoạch', -- Trạng thái: Lập kế hoạch, Đang thực hiện, Đã hoàn thành
  tien_do integer DEFAULT 0,          -- Tiến độ (0-100%)
  ngay_bat_dau date,                  -- Ngày bắt đầu
  ngay_ket_thuc date,                 -- Ngày kết thúc dự kiến
  muc_tieu text,                      -- Mục tiêu cải tiến
  van_de text,                        -- Vấn đề cần giải quyết
  giai_phap text,                     -- Giải pháp đề xuất
  ket_qua text,                       -- Kết quả đạt được
  nguoi_phu_trach text,               -- Người phụ trách
  ghi_chu text,                       -- Ghi chú
  created_at timestamp with time zone DEFAULT now()
);

-- Policy: Cho phép tất cả thao tác CRUD
CREATE POLICY "ke_hoach_cai_tien: Select all" ON ke_hoach_cai_tien
  FOR SELECT USING (true);
CREATE POLICY "ke_hoach_cai_tien: Insert" ON ke_hoach_cai_tien
  FOR INSERT WITH CHECK (true);
CREATE POLICY "ke_hoach_cai_tien: Update" ON ke_hoach_cai_tien
  FOR UPDATE USING (true);
CREATE POLICY "ke_hoach_cai_tien: Delete" ON ke_hoach_cai_tien
  FOR DELETE USING (true);
