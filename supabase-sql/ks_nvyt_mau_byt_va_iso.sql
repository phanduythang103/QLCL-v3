-- 1) Phiếu khảo sát ý kiến nhân viên y tế theo mẫu Bộ Y tế (Mẫu số 3)
--    Điểm từng câu lưu ở cột trùng mã câu (a1..e7), thang 1-5.
--    Các cột mẫu cũ (block, position, years, q1..q13, pressure...) được giữ để xem lại phiếu đã thu.
-- 2) Khảo sát hài lòng khách hàng với dịch vụ xét nghiệm (ISO 15189) - bảng mới ks_hai_long_iso.

-- ── 1. NVYT ──
ALTER TABLE public.staff_satisfaction_2026_responses
    ADD COLUMN IF NOT EXISTS gender TEXT,               -- A1: nam | nu
    ADD COLUMN IF NOT EXISTS age INTEGER,               -- A2
    ADD COLUMN IF NOT EXISTS chuyen_mon TEXT,           -- A3: mã 1-5
    ADD COLUMN IF NOT EXISTS chuyen_mon_other TEXT,
    ADD COLUMN IF NOT EXISTS bang_cap TEXT,             -- A4: mã 1-6
    ADD COLUMN IF NOT EXISTS bang_cap_other TEXT,
    ADD COLUMN IF NOT EXISTS nam_nganh_y INTEGER,       -- A5
    ADD COLUMN IF NOT EXISTS nam_tai_bv INTEGER,        -- A6
    ADD COLUMN IF NOT EXISTS vi_tri TEXT,               -- A7: mã 1-6
    ADD COLUMN IF NOT EXISTS vi_tri_other TEXT,
    ADD COLUMN IF NOT EXISTS pham_vi TEXT,              -- A8: mã 1-12
    ADD COLUMN IF NOT EXISTS pham_vi_other TEXT,
    ADD COLUMN IF NOT EXISTS kiem_nhiem TEXT,           -- A9: mã 1-3
    ADD COLUMN IF NOT EXISTS so_lan_truc INTEGER,       -- A10
    ADD COLUMN IF NOT EXISTS a1 SMALLINT CHECK (a1 BETWEEN 1 AND 5),
    ADD COLUMN IF NOT EXISTS a2 SMALLINT CHECK (a2 BETWEEN 1 AND 5),
    ADD COLUMN IF NOT EXISTS a3 SMALLINT CHECK (a3 BETWEEN 1 AND 5),
    ADD COLUMN IF NOT EXISTS a4 SMALLINT CHECK (a4 BETWEEN 1 AND 5),
    ADD COLUMN IF NOT EXISTS a5 SMALLINT CHECK (a5 BETWEEN 1 AND 5),
    ADD COLUMN IF NOT EXISTS a6 SMALLINT CHECK (a6 BETWEEN 1 AND 5),
    ADD COLUMN IF NOT EXISTS a7 SMALLINT CHECK (a7 BETWEEN 1 AND 5),
    ADD COLUMN IF NOT EXISTS a8 SMALLINT CHECK (a8 BETWEEN 1 AND 5),
    ADD COLUMN IF NOT EXISTS a9 SMALLINT CHECK (a9 BETWEEN 1 AND 5),
    ADD COLUMN IF NOT EXISTS b1 SMALLINT CHECK (b1 BETWEEN 1 AND 5),
    ADD COLUMN IF NOT EXISTS b2 SMALLINT CHECK (b2 BETWEEN 1 AND 5),
    ADD COLUMN IF NOT EXISTS b3 SMALLINT CHECK (b3 BETWEEN 1 AND 5),
    ADD COLUMN IF NOT EXISTS b4 SMALLINT CHECK (b4 BETWEEN 1 AND 5),
    ADD COLUMN IF NOT EXISTS b5 SMALLINT CHECK (b5 BETWEEN 1 AND 5),
    ADD COLUMN IF NOT EXISTS b6 SMALLINT CHECK (b6 BETWEEN 1 AND 5),
    ADD COLUMN IF NOT EXISTS b7 SMALLINT CHECK (b7 BETWEEN 1 AND 5),
    ADD COLUMN IF NOT EXISTS b8 SMALLINT CHECK (b8 BETWEEN 1 AND 5),
    ADD COLUMN IF NOT EXISTS b9 SMALLINT CHECK (b9 BETWEEN 1 AND 5),
    ADD COLUMN IF NOT EXISTS c1 SMALLINT CHECK (c1 BETWEEN 1 AND 5),
    ADD COLUMN IF NOT EXISTS c2 SMALLINT CHECK (c2 BETWEEN 1 AND 5),
    ADD COLUMN IF NOT EXISTS c3 SMALLINT CHECK (c3 BETWEEN 1 AND 5),
    ADD COLUMN IF NOT EXISTS c4 SMALLINT CHECK (c4 BETWEEN 1 AND 5),
    ADD COLUMN IF NOT EXISTS c5 SMALLINT CHECK (c5 BETWEEN 1 AND 5),
    ADD COLUMN IF NOT EXISTS c6 SMALLINT CHECK (c6 BETWEEN 1 AND 5),
    ADD COLUMN IF NOT EXISTS c7 SMALLINT CHECK (c7 BETWEEN 1 AND 5),
    ADD COLUMN IF NOT EXISTS c8 SMALLINT CHECK (c8 BETWEEN 1 AND 5),
    ADD COLUMN IF NOT EXISTS c9 SMALLINT CHECK (c9 BETWEEN 1 AND 5),
    ADD COLUMN IF NOT EXISTS c10 SMALLINT CHECK (c10 BETWEEN 1 AND 5),
    ADD COLUMN IF NOT EXISTS c11 SMALLINT CHECK (c11 BETWEEN 1 AND 5),
    ADD COLUMN IF NOT EXISTS c12 SMALLINT CHECK (c12 BETWEEN 1 AND 5),
    ADD COLUMN IF NOT EXISTS d1 SMALLINT CHECK (d1 BETWEEN 1 AND 5),
    ADD COLUMN IF NOT EXISTS d2 SMALLINT CHECK (d2 BETWEEN 1 AND 5),
    ADD COLUMN IF NOT EXISTS d3 SMALLINT CHECK (d3 BETWEEN 1 AND 5),
    ADD COLUMN IF NOT EXISTS d4 SMALLINT CHECK (d4 BETWEEN 1 AND 5),
    ADD COLUMN IF NOT EXISTS d5 SMALLINT CHECK (d5 BETWEEN 1 AND 5),
    ADD COLUMN IF NOT EXISTS d6 SMALLINT CHECK (d6 BETWEEN 1 AND 5),
    ADD COLUMN IF NOT EXISTS d7 SMALLINT CHECK (d7 BETWEEN 1 AND 5),
    ADD COLUMN IF NOT EXISTS e1 SMALLINT CHECK (e1 BETWEEN 1 AND 5),
    ADD COLUMN IF NOT EXISTS e2 SMALLINT CHECK (e2 BETWEEN 1 AND 5),
    ADD COLUMN IF NOT EXISTS e3 SMALLINT CHECK (e3 BETWEEN 1 AND 5),
    ADD COLUMN IF NOT EXISTS e4 SMALLINT CHECK (e4 BETWEEN 1 AND 5),
    ADD COLUMN IF NOT EXISTS e5 SMALLINT CHECK (e5 BETWEEN 1 AND 5),
    ADD COLUMN IF NOT EXISTS e6 SMALLINT CHECK (e6 BETWEEN 1 AND 5),
    ADD COLUMN IF NOT EXISTS e7 SMALLINT CHECK (e7 BETWEEN 1 AND 5);

COMMENT ON COLUMN public.staff_satisfaction_2026_responses.suggestion IS 'G: Ý kiến hoặc đề xuất khác (mẫu BYT)';

UPDATE public.survey_public_configs
SET survey_name = 'Khảo sát ý kiến nhân viên y tế (Mẫu số 3 - BYT)'
WHERE survey_type = 'staff';

-- ── 2. Hài lòng khách hàng dịch vụ xét nghiệm (ISO) ──
CREATE TABLE IF NOT EXISTS public.ks_hai_long_iso (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mau TEXT NOT NULL,                  -- huyet_hoc | sinh_hoa | vi_sinh | giai_phau_benh | sinh_hoc_phan_tu
    answers JSONB NOT NULL DEFAULT '{}'::jsonb, -- câu trả lời theo mã câu
    satisfaction_percent INTEGER,       -- % hài lòng = điểm đạt / điểm tối đa các câu chấm điểm (null nếu phiếu không chấm điểm)
    ngay_khao_sat TIMESTAMP WITH TIME ZONE DEFAULT timezone('ict'::text, now()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('ict'::text, now())
);

CREATE INDEX IF NOT EXISTS ks_hai_long_iso_mau_idx ON public.ks_hai_long_iso (mau, ngay_khao_sat DESC);

ALTER TABLE public.ks_hai_long_iso ENABLE ROW LEVEL SECURITY;

-- Policies (thống nhất với survey_public_configs.sql: app dùng đăng nhập riêng, không qua Supabase Auth)
DROP POLICY IF EXISTS "ISO: Anonymous Insert" ON public.ks_hai_long_iso;
DROP POLICY IF EXISTS "ISO: Public Select" ON public.ks_hai_long_iso;
DROP POLICY IF EXISTS "ISO: Anonymous Update" ON public.ks_hai_long_iso;
DROP POLICY IF EXISTS "ISO: Anonymous Delete" ON public.ks_hai_long_iso;
DROP POLICY IF EXISTS "ISO: Admin Full Access" ON public.ks_hai_long_iso;

CREATE POLICY "ISO: Anonymous Insert" ON public.ks_hai_long_iso FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "ISO: Public Select" ON public.ks_hai_long_iso FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "ISO: Anonymous Update" ON public.ks_hai_long_iso FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "ISO: Anonymous Delete" ON public.ks_hai_long_iso FOR DELETE TO anon USING (true);
CREATE POLICY "ISO: Admin Full Access" ON public.ks_hai_long_iso FOR ALL TO authenticated USING (true) WITH CHECK (true);

GRANT ALL ON TABLE public.ks_hai_long_iso TO anon;
GRANT ALL ON TABLE public.ks_hai_long_iso TO authenticated;
GRANT ALL ON TABLE public.ks_hai_long_iso TO service_role;

COMMENT ON TABLE public.ks_hai_long_iso IS 'Khảo sát hài lòng khách hàng (lâm sàng) với dịch vụ xét nghiệm - ISO 15189';

-- Đăng ký khảo sát để bật/tắt public và tạo link QR (thêm ?mau=<khoa> để mở sẵn phiếu của một khoa)
INSERT INTO public.survey_public_configs (survey_type, survey_name, is_public, slug)
VALUES ('iso', 'Khảo sát hài lòng khách hàng dịch vụ xét nghiệm (ISO)', false, 'hai-long-iso')
ON CONFLICT (survey_type) DO UPDATE
SET survey_name = EXCLUDED.survey_name,
    slug = COALESCE(public.survey_public_configs.slug, EXCLUDED.slug);

NOTIFY pgrst, 'reload schema';
