-- Tạo bảng bc_cqy (Báo cáo Cục Quân y)
CREATE TABLE bc_cqy (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ngay_bao_cao date NOT NULL,                -- Ngày báo cáo
  noi_dung_bao_cao text NOT NULL,            -- Nội dung báo cáo
  noi_xay_ra text,                           -- Nơi xảy ra
  thoi_gian_xay_ra text,                    -- Thời gian xảy ra (giờ:phút ngày/tháng/năm)
  noi_dung_ket_luan text,                    -- Nội dung kết luận
  created_at timestamp with time zone DEFAULT now()
);

-- Bật RLS
ALTER TABLE bc_cqy ENABLE ROW LEVEL SECURITY;

-- Policy: Cho phép tất cả thao tác CRUD (Full policies)
CREATE POLICY "bc_cqy: Select all" ON bc_cqy FOR SELECT USING (true);
CREATE POLICY "bc_cqy: Insert" ON bc_cqy FOR INSERT WITH CHECK (true);
CREATE POLICY "bc_cqy: Update" ON bc_cqy FOR UPDATE USING (true);
CREATE POLICY "bc_cqy: Delete" ON bc_cqy FOR DELETE USING (true);
