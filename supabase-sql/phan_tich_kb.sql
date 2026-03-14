-- ============================================================
-- Bảng phân tích kết quả giám sát khám bệnh
-- Table: phan_tich_kb
-- Khoá liên kết: ma_bn (mã bệnh nhân, từ bảng gs_kham_benh)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.phan_tich_kb (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),

    ngay_phan_tich  DATE    NOT NULL DEFAULT CURRENT_DATE,
    nguoi_phan_tich TEXT    NOT NULL,

    -- Khoá liên kết với bảng gs_kham_benh
    ma_bn           TEXT    NOT NULL,

    -- Nội dung phân tích: mảng JSON
    -- Mỗi phần tử: { stt, nguyen_nhan, tan_suat, giai_phap, nguoi_thuc_hien }
    noi_dung JSONB NOT NULL DEFAULT '[]'::jsonb,

    ghi_chu TEXT
);

ALTER TABLE public.phan_tich_kb ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "phan_tich_kb_select_policy" ON public.phan_tich_kb;
DROP POLICY IF EXISTS "phan_tich_kb_insert_policy" ON public.phan_tich_kb;
DROP POLICY IF EXISTS "phan_tich_kb_update_policy" ON public.phan_tich_kb;
DROP POLICY IF EXISTS "phan_tich_kb_delete_policy" ON public.phan_tich_kb;

CREATE POLICY "phan_tich_kb_select_policy" ON public.phan_tich_kb FOR SELECT USING (true);
CREATE POLICY "phan_tich_kb_insert_policy" ON public.phan_tich_kb FOR INSERT WITH CHECK (true);
CREATE POLICY "phan_tich_kb_update_policy" ON public.phan_tich_kb FOR UPDATE USING (true);
CREATE POLICY "phan_tich_kb_delete_policy" ON public.phan_tich_kb FOR DELETE USING (true);

COMMENT ON COLUMN public.phan_tich_kb.ma_bn IS 'Mã bệnh nhân — liên kết với gs_kham_benh.ma_bn';
COMMENT ON COLUMN public.phan_tich_kb.noi_dung IS '[{stt, nguyen_nhan, tan_suat, giai_phap, nguoi_thuc_hien}]';
