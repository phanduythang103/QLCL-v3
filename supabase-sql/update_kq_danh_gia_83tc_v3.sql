-- Thêm cột phieu_id để nhóm các tiêu chí vào cùng một phiếu chấm điểm
ALTER TABLE public.kq_danh_gia_83tc ADD COLUMN IF NOT EXISTS phieu_id uuid;
-- Thêm cột nguoi_tao_id để phân quyền sửa/xóa
ALTER TABLE public.kq_danh_gia_83tc ADD COLUMN IF NOT EXISTS nguoi_tao_id uuid REFERENCES public.users(id);

-- Tạo Index để truy vấn theo phieu_id và nguoi_tao_id nhanh hơn
CREATE INDEX IF NOT EXISTS idx_kq83_phieu_id ON public.kq_danh_gia_83tc(phieu_id);
CREATE INDEX IF NOT EXISTS idx_kq83_nguoi_tao ON public.kq_danh_gia_83tc(nguoi_tao_id);
