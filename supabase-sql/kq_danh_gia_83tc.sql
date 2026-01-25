-- Bảng lưu kết quả đánh giá 83 tiêu chí (Chi tiết)
CREATE TABLE public.kq_danh_gia_83tc (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ngay_danh_gia date NOT NULL DEFAULT CURRENT_DATE,
  nguoi_danh_gia text NOT NULL,
  don_vi_duoc_danh_gia text NOT NULL, -- Tên đơn vị hoặc mã đơn vị từ dm_don_vi
  
  -- Thông tin chi tiết từ data83 (Để lưu vết tại thời điểm đánh giá)
  phan text,
  chuong text,
  ma_tieu_muc text NOT NULL,
  tieu_muc text,
  nhom text,
  
  -- Kết quả chấm điểm
  dat boolean DEFAULT false,
  khong_dat boolean DEFAULT false,
  dat_muc text,                        -- Mức đạt được (VD: 1, 2, 3, 4, 5)
  ghi_chu text,
  
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Index để truy vấn nhanh
CREATE INDEX idx_kq83_ngay ON public.kq_danh_gia_83tc(ngay_danh_gia);
CREATE INDEX idx_kq83_don_vi ON public.kq_danh_gia_83tc(don_vi_duoc_danh_gia);
CREATE INDEX idx_kq83_ma_tieu_muc ON public.kq_danh_gia_83tc(ma_tieu_muc);

-- Enable RLS
ALTER TABLE public.kq_danh_gia_83tc ENABLE ROW LEVEL SECURITY;

-- Allow all for authenticated users
CREATE POLICY "Allow all actions for authenticated users" ON public.kq_danh_gia_83tc
  FOR ALL USING (true) WITH CHECK (true);
