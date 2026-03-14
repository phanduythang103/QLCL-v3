-- Bảng theo dõi công suất sử dụng giường bệnh
CREATE TABLE cong_suat_giuong (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ngay_bao_cao date NOT NULL DEFAULT CURRENT_DATE,    -- Ngày báo cáo
  nguoi_bao_cao text NOT NULL,                         -- Người báo cáo
  don_vi text NOT NULL,                                -- Đơn vị
  so_giuong integer NOT NULL DEFAULT 0,                -- Số giường
  tong_ngay_dieu_tri_thuc_te integer NOT NULL DEFAULT 0, -- Tổng ngày điều trị thực tế
  so_ngay_trong_ky integer NOT NULL DEFAULT 0,         -- Số ngày trong kỳ
  cong_suat numeric(5,2) NOT NULL DEFAULT 0,           -- Công suất (%)
  ghi_chu text,                                        -- Ghi chú
  nguoi_tao_id uuid DEFAULT auth.uid(),                -- Link tới auth.users
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Bật RLS
ALTER TABLE cong_suat_giuong ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "cong_suat_giuong: Select" ON cong_suat_giuong FOR SELECT USING (true);
CREATE POLICY "cong_suat_giuong: Insert" ON cong_suat_giuong FOR INSERT WITH CHECK (true);
CREATE POLICY "cong_suat_giuong: Update" ON cong_suat_giuong FOR UPDATE USING (true);
CREATE POLICY "cong_suat_giuong: Delete" ON cong_suat_giuong FOR DELETE USING (true);

-- Index
CREATE INDEX idx_cong_suat_giuong_ngay ON cong_suat_giuong(ngay_bao_cao);
CREATE INDEX idx_cong_suat_giuong_don_vi ON cong_suat_giuong(don_vi);
