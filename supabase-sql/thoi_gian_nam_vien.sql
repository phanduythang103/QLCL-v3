-- Bảng theo dõi thời gian nằm viện trung bình
CREATE TABLE thoi_gian_nam_vien (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ngay_bao_cao date NOT NULL DEFAULT CURRENT_DATE,
  nguoi_bao_cao text NOT NULL,                    -- Tên người báo cáo (lấy từ user)
  don_vi text NOT NULL,                          -- Đơn vị (lấy từ danh mục dm_don_vi)
  tong_luot_ra_vien integer NOT NULL DEFAULT 0,  -- Tổng số lượt ra viện
  tong_ngay_dieu_tri integer NOT NULL DEFAULT 0, -- Tổng số ngày điều trị
  ngay_tb numeric(10,2) DEFAULT 0,               -- Ngày điều trị trung bình
  muc_tieu numeric(10,2) DEFAULT 0,              -- Mục tiêu
  chenh_lech numeric(10,2) DEFAULT 0,            -- Chênh lệch (TB - Mục tiêu)
  nguoi_tao_id uuid DEFAULT auth.uid(),          -- Link tới auth.users
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Bật RLS
ALTER TABLE thoi_gian_nam_vien ENABLE ROW LEVEL SECURITY;

-- Policies (Cho phép tất cả quyền truy cập cơ bản trong hệ thống nội bộ)
CREATE POLICY "thoi_gian_nam_vien: Select" ON thoi_gian_nam_vien FOR SELECT USING (true);
CREATE POLICY "thoi_gian_nam_vien: Insert" ON thoi_gian_nam_vien FOR INSERT WITH CHECK (true);
CREATE POLICY "thoi_gian_nam_vien: Update" ON thoi_gian_nam_vien FOR UPDATE USING (true);
CREATE POLICY "thoi_gian_nam_vien: Delete" ON thoi_gian_nam_vien FOR DELETE USING (true);

-- Index để truy vấn nhanh theo ngày và đơn vị
CREATE INDEX idx_nam_vien_ngay ON thoi_gian_nam_vien(ngay_bao_cao);
CREATE INDEX idx_nam_vien_don_vi ON thoi_gian_nam_vien(don_vi);
