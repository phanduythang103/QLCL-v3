-- Cập nhật bảng kết quả đánh giá 83 tiêu chí (Thêm trạng thái Không đánh giá)
ALTER TABLE public.kq_danh_gia_83tc ADD COLUMN IF NOT EXISTS khong_danh_gia boolean DEFAULT false;

-- Cập nhật INDEX nếu cần
CREATE INDEX IF NOT EXISTS idx_kq83_khong_dg ON public.kq_danh_gia_83tc(khong_danh_gia);
