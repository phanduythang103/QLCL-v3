-- ============================================================
-- Bảng: gs_ra_vao_vien
-- Mô tả: Giám sát chế độ Ra/Vào viện, Chuyển khoa, Chuyển viện
-- ============================================================

-- 1. Tạo bảng
CREATE TABLE IF NOT EXISTS public.gs_ra_vao_vien (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at  TIMESTAMPTZ DEFAULT timezone('utc', now()),
    updated_at  TIMESTAMPTZ DEFAULT timezone('utc', now()),

    -- Thông tin chung
    ngay_giam_sat TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    nguoi_gs      TEXT NOT NULL,
    khoa_gs       TEXT NOT NULL,
    doi_tuong_gs  TEXT[] DEFAULT '{}',  -- [Vào viện, Chuyển khoa, Chuyển viện, Ra viện]

    -- I. CHẾ ĐỘ VÀO VIỆN
    c1  BOOLEAN NOT NULL DEFAULT true,  c1_ghi_chu  TEXT,
    c2  BOOLEAN NOT NULL DEFAULT true,  c2_ghi_chu  TEXT,
    c3  BOOLEAN NOT NULL DEFAULT true,  c3_ghi_chu  TEXT,

    -- II. CHẾ ĐỘ CHUYỂN KHOA
    c4  BOOLEAN NOT NULL DEFAULT true,  c4_ghi_chu  TEXT,
    c5  BOOLEAN NOT NULL DEFAULT true,  c5_ghi_chu  TEXT,
    c6  BOOLEAN NOT NULL DEFAULT true,  c6_ghi_chu  TEXT,

    -- III. CHẾ ĐỘ CHUYỂN VIỆN
    c7  BOOLEAN NOT NULL DEFAULT true,  c7_ghi_chu  TEXT,
    c8  BOOLEAN NOT NULL DEFAULT true,  c8_ghi_chu  TEXT,
    c9  BOOLEAN NOT NULL DEFAULT true,  c9_ghi_chu  TEXT,

    -- IV. CHẾ ĐỘ RA VIỆN
    c10 BOOLEAN NOT NULL DEFAULT true,  c10_ghi_chu TEXT,
    c11 BOOLEAN NOT NULL DEFAULT true,  c11_ghi_chu TEXT,
    c12 BOOLEAN NOT NULL DEFAULT true,  c12_ghi_chu TEXT,

    -- V. AN TOÀN NGƯỜI BỆNH
    c13 BOOLEAN NOT NULL DEFAULT true,  c13_ghi_chu TEXT,
    c14 BOOLEAN NOT NULL DEFAULT true,  c14_ghi_chu TEXT,

    -- Tổng hợp
    ket_luan_chung        TEXT,
    hinh_anh_minh_chung   TEXT[] DEFAULT '{}',
    tong_dat              INTEGER DEFAULT 14,
    tong_tieu_chi         INTEGER DEFAULT 14,
    ty_le_tuan_thu        DECIMAL(5,2) DEFAULT 100.00
);

COMMENT ON TABLE public.gs_ra_vao_vien IS 'Giám sát chế độ ra vào viện, chuyển khoa, chuyển viện';

-- 2. Bật RLS
ALTER TABLE public.gs_ra_vao_vien ENABLE ROW LEVEL SECURITY;

-- 3. Xóa policy cũ
DROP POLICY IF EXISTS "Enable all for authenticated users ra_vao_vien" ON public.gs_ra_vao_vien;
DROP POLICY IF EXISTS "anon_select_gs_ra_vao_vien"  ON public.gs_ra_vao_vien;
DROP POLICY IF EXISTS "anon_insert_gs_ra_vao_vien"  ON public.gs_ra_vao_vien;
DROP POLICY IF EXISTS "anon_update_gs_ra_vao_vien"  ON public.gs_ra_vao_vien;
DROP POLICY IF EXISTS "anon_delete_gs_ra_vao_vien"  ON public.gs_ra_vao_vien;
DROP POLICY IF EXISTS "auth_all_gs_ra_vao_vien"     ON public.gs_ra_vao_vien;

-- 4. Policy Anonymous
CREATE POLICY "anon_select_gs_ra_vao_vien"
    ON public.gs_ra_vao_vien FOR SELECT TO anon USING (true);

CREATE POLICY "anon_insert_gs_ra_vao_vien"
    ON public.gs_ra_vao_vien FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "anon_update_gs_ra_vao_vien"
    ON public.gs_ra_vao_vien FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "anon_delete_gs_ra_vao_vien"
    ON public.gs_ra_vao_vien FOR DELETE TO anon USING (true);

-- 5. Policy Authenticated — toàn quyền
CREATE POLICY "auth_all_gs_ra_vao_vien"
    ON public.gs_ra_vao_vien FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 6. Indexes
CREATE INDEX IF NOT EXISTS idx_gs_ra_vao_vien_khoa ON public.gs_ra_vao_vien (khoa_gs);
CREATE INDEX IF NOT EXISTS idx_gs_ra_vao_vien_ngay ON public.gs_ra_vao_vien (ngay_giam_sat DESC);

-- 7. Trigger tự cập nhật updated_at
CREATE OR REPLACE FUNCTION update_updated_at_ra_vao_vien()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = timezone('utc', now());
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ra_vao_vien_updated_at ON public.gs_ra_vao_vien;
CREATE TRIGGER trg_ra_vao_vien_updated_at
    BEFORE UPDATE ON public.gs_ra_vao_vien
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_ra_vao_vien();
