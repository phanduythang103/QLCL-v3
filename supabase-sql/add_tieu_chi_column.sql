-- Thêm cột tieu_chi để hỗ trợ tính điểm trung bình theo phân cấp
ALTER TABLE public.kq_danh_gia_83tc ADD COLUMN IF NOT EXISTS tieu_chi text;

-- Tạo index cho tieu_chi
CREATE INDEX IF NOT EXISTS idx_kq83_tieu_chi ON public.kq_danh_gia_83tc(tieu_chi);
