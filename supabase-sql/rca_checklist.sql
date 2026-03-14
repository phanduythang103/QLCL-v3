-- Tạo bảng rca_checklist (Bảng kiểm giám sát phản ứng RCA)
CREATE TABLE rca_checklist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ngay_giam_sat date NOT NULL,                   -- Ngày giám sát
  nguoi_giam_sat text NOT NULL,                 -- Người giám sát
  ma_scyk text NOT NULL,                        -- Mã SCYK
  
  -- Tiêu chí 1: Sự cố báo cáo trong 24h
  c1_dat boolean DEFAULT false,                 -- Đạt (true) / Không đạt (false)
  c1_ghi_chu text,                              -- Ghi chú
  
  -- Tiêu chí 2: Thành lập đội RCA trong 48h
  c2_dat boolean DEFAULT false,
  c2_ghi_chu text,
  
  -- Tiêu chí 3: Xác định yếu tố hệ thống (Quy trình, Con người, Thiết bị...)
  c3_dat boolean DEFAULT false,
  c3_ghi_chu text,
  
  -- Tiêu chí 4: Có kế hoạch hành động cải tiến cụ thể
  c4_dat boolean DEFAULT false,
  c4_ghi_chu text,
  
  -- Tiêu chí 5: Phổ biến bài học kinh nghiệm cho toàn Bệnh viện (không đổ lỗi)
  c5_dat boolean DEFAULT false,
  c5_ghi_chu text,
  
  created_at timestamp with time zone DEFAULT now()
);

-- Bật RLS
ALTER TABLE rca_checklist ENABLE ROW LEVEL SECURITY;

-- Policy: Select all
CREATE POLICY "rca_checklist: Select all" ON rca_checklist
  FOR SELECT USING (true);

-- Policy: Insert
CREATE POLICY "rca_checklist: Insert" ON rca_checklist
  FOR INSERT WITH CHECK (true);

-- Policy: Update
CREATE POLICY "rca_checklist: Update" ON rca_checklist
  FOR UPDATE USING (true);

-- Policy: Delete
CREATE POLICY "rca_checklist: Delete" ON rca_checklist
  FOR DELETE USING (true);

-- Comment mô tả bảng và tiêu chí
COMMENT ON TABLE rca_checklist IS 'Bảng kiểm giám sát các phản ứng sau sự cố y khoa (RCA)';
COMMENT ON COLUMN rca_checklist.c1_dat IS 'Sự cố được báo cáo trong vòng 24 giờ kể từ khi phát hiện';
COMMENT ON COLUMN rca_checklist.c2_dat IS 'Thành lập đội phân tích nguyên nhân gốc rễ (RCA) trong 48 giờ';
COMMENT ON COLUMN rca_checklist.c3_dat IS 'Xác định được các yếu tố hệ thống gây ra sự cố (Quy trình, Con người, Thiết bị...)';
COMMENT ON COLUMN rca_checklist.c4_dat IS 'Có kế hoạch hành động cải tiến cụ thể để ngăn chặn tái diễn';
COMMENT ON COLUMN rca_checklist.c5_dat IS 'Phổ biến bài học kinh nghiệm cho toàn Bệnh viện mà không mang tính đổ lỗi';
