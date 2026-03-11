-- Tạo bảng nkvm (Nhiễm khuẩn vết mổ)
CREATE TABLE nkvm (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ngay_giam_sat date NOT NULL,               -- Ngày giám sát
  nguoi_giam_sat text NOT NULL,              -- Người giám sát
  khoa_duoc_giam_sat text NOT NULL,          -- Khoa được giám sát
  ten_nguoi_benh text NOT NULL,              -- Tên người bệnh
  nam_sinh text,                             -- Năm sinh
  ma_hsba text,                              -- Mã HSBA
  ngay_phau_thuat date,                      -- Ngày phẫu thuật
  loai_phau_thuat text,                      -- Loại phẫu thuật (checkbox: Sạch/Sạch-nhiễm/Nhiễm)
  dau_hieu_lam_sang text,                    -- Dấu hiệu lâm sàng (checkbox: Sưng, nóng, đỏ, đau; Chảy mủ từ vết mổ; Vết mổ hở tự nhiên)
  can_thiep text,                            -- Can thiệp (checkbox: Bác sĩ phải mở vết mổ; Chọc hút dịch từ vết mổ)
  ket_qua_vi_sinh text,                      -- Kết quả vi sinh
  phan_loai_nkvm text,                       -- Phân loại NKVM (checkbox: Nông/Sâu/Cơ quan - Khoang cơ thể)
  created_at timestamp with time zone DEFAULT now()
);

-- Cho phép Row Level Security (RLS)
ALTER TABLE nkvm ENABLE ROW LEVEL SECURITY;

-- Policy: Cho phép tất cả thao tác CRUD
CREATE POLICY "nkvm: Select all" ON nkvm
  FOR SELECT USING (true);
CREATE POLICY "nkvm: Insert" ON nkvm
  FOR INSERT WITH CHECK (true);
CREATE POLICY "nkvm: Update" ON nkvm
  FOR UPDATE USING (true);
CREATE POLICY "nkvm: Delete" ON nkvm
  FOR DELETE USING (true);
