-- Bảng phân tích các trường hợp nằm viện kéo dài
CREATE TABLE phan_tich_nam_vien_keo_dai (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ngay_phan_tich date NOT NULL DEFAULT CURRENT_DATE, -- Ngày phân tích
  nguoi_phan_tich text NOT NULL,                      -- Người phân tích
  ma_bn text NOT NULL,                               -- Mã người bệnh
  chan_doan text NOT NULL,                           -- Chẩn đoán
  ngay_vao_vien date NOT NULL,                       -- Ngày vào viện
  so_ngay_dieu_tri integer NOT NULL DEFAULT 0,       -- Số ngày điều trị
  ly_do_keo_dai text NOT NULL,                       -- Lý do nằm viện kéo dài
  giai_phap_de_xuat text,                            -- Đề xuất giải pháp
  nguoi_tao_id uuid DEFAULT auth.uid(),              -- Link tới auth.users
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Bật RLS
ALTER TABLE phan_tich_nam_vien_keo_dai ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "phan_tich_nam_vien_keo_dai: Select" ON phan_tich_nam_vien_keo_dai FOR SELECT USING (true);
CREATE POLICY "phan_tich_nam_vien_keo_dai: Insert" ON phan_tich_nam_vien_keo_dai FOR INSERT WITH CHECK (true);
CREATE POLICY "phan_tich_nam_vien_keo_dai: Update" ON phan_tich_nam_vien_keo_dai FOR UPDATE USING (true);
CREATE POLICY "phan_tich_nam_vien_keo_dai: Delete" ON phan_tich_nam_vien_keo_dai FOR DELETE USING (true);

-- Index
CREATE INDEX idx_pt_nam_vien_ngay ON phan_tich_nam_vien_keo_dai(ngay_phan_tich);
CREATE INDEX idx_pt_nam_vien_ma_bn ON phan_tich_nam_vien_keo_dai(ma_bn);
