-- ============================================================
-- Bảng giám sát quy trình khám bệnh ngoại trú
-- Table: gs_kham_benh
-- ============================================================

CREATE TABLE IF NOT EXISTS public.gs_kham_benh (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),

    ngay_giam_sat   DATE    NOT NULL DEFAULT CURRENT_DATE,
    nguoi_giam_sat  TEXT    NOT NULL,
    ma_bn           TEXT    NOT NULL,   -- Mã bệnh nhân (khoá liên kết với phan_tich_kb)

    gio_dang_ky         TIME,
    gio_kham            TIME,
    gio_ket_qua_xn      TIME,
    gio_ket_qua_cdha    TIME,
    gio_bs_ket_luan     TIME,
    gio_nhan_thuoc      TIME,

    tong_thoi_gian  NUMERIC,   -- phút, tính bằng TypeScript

    ghi_chu         TEXT
);

-- Nếu bảng đã tồn tại với cột GENERATED cũ, chạy lệnh dưới để sửa:
-- ALTER TABLE public.gs_kham_benh DROP COLUMN IF EXISTS ma_giam_sat;
-- ALTER TABLE public.gs_kham_benh DROP COLUMN IF EXISTS tong_thoi_gian;
-- ALTER TABLE public.gs_kham_benh ADD COLUMN IF NOT EXISTS tong_thoi_gian NUMERIC;

ALTER TABLE public.gs_kham_benh ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "gs_kham_benh_select_policy" ON public.gs_kham_benh;
DROP POLICY IF EXISTS "gs_kham_benh_insert_policy" ON public.gs_kham_benh;
DROP POLICY IF EXISTS "gs_kham_benh_update_policy" ON public.gs_kham_benh;
DROP POLICY IF EXISTS "gs_kham_benh_delete_policy" ON public.gs_kham_benh;

CREATE POLICY "gs_kham_benh_select_policy" ON public.gs_kham_benh FOR SELECT USING (true);
CREATE POLICY "gs_kham_benh_insert_policy" ON public.gs_kham_benh FOR INSERT WITH CHECK (true);
CREATE POLICY "gs_kham_benh_update_policy" ON public.gs_kham_benh FOR UPDATE USING (true);
CREATE POLICY "gs_kham_benh_delete_policy" ON public.gs_kham_benh FOR DELETE USING (true);
