-- ============================================================
-- Bảng: lich_su_bao_cao
-- Mô tả: Lưu lịch sử xuất báo cáo từ Báo cáo Tổng hợp
-- ============================================================

-- 1. Tạo bảng (nếu chưa tồn tại)
CREATE TABLE IF NOT EXISTS public.lich_su_bao_cao (
    id          SERIAL PRIMARY KEY,
    ten_bao_cao VARCHAR(500)  NOT NULL,               -- Tên + số bản ghi
    loai_bao_cao VARCHAR(200),                        -- Tên module báo cáo
    ky_bao_cao  VARCHAR(200),                         -- Kỳ lọc (Tháng này, 01/2025→31/01/2025...)
    nguoi_tao   VARCHAR(255),                         -- Họ tên (username) người xuất
    ngay_tao    VARCHAR(50),                          -- dd/MM/yyyy HH:mm (giờ Việt Nam)
    duong_dan   TEXT,                                 -- Đường dẫn file (dự phòng)
    trang_thai  VARCHAR(50)  DEFAULT 'Đã xuất',
    ghi_chu     TEXT,
    created_at  TIMESTAMPTZ  DEFAULT NOW()
);

-- 2. Cập nhật cột ngay_tao nếu bảng đã tồn tại dạng DATE cũ → VARCHAR
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'lich_su_bao_cao'
          AND column_name = 'ngay_tao'
          AND data_type = 'date'
    ) THEN
        ALTER TABLE public.lich_su_bao_cao
            ALTER COLUMN ngay_tao TYPE VARCHAR(50) USING ngay_tao::text;
    END IF;
END $$;

-- 3. Bật Row Level Security
ALTER TABLE public.lich_su_bao_cao ENABLE ROW LEVEL SECURITY;

-- 4. Xóa policy cũ (nếu có) để tránh xung đột
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.lich_su_bao_cao;
DROP POLICY IF EXISTS "anon_select_lich_su_bao_cao"      ON public.lich_su_bao_cao;
DROP POLICY IF EXISTS "anon_insert_lich_su_bao_cao"      ON public.lich_su_bao_cao;
DROP POLICY IF EXISTS "anon_update_lich_su_bao_cao"      ON public.lich_su_bao_cao;
DROP POLICY IF EXISTS "anon_delete_lich_su_bao_cao"      ON public.lich_su_bao_cao;

-- 5. Policy: Anonymous — đọc toàn bộ lịch sử
CREATE POLICY "anon_select_lich_su_bao_cao"
    ON public.lich_su_bao_cao
    FOR SELECT
    TO anon
    USING (true);

-- 6. Policy: Anonymous — ghi bản ghi mới khi xuất báo cáo
CREATE POLICY "anon_insert_lich_su_bao_cao"
    ON public.lich_su_bao_cao
    FOR INSERT
    TO anon
    WITH CHECK (true);

-- 7. Policy: Anonymous — cập nhật (dự phòng)
CREATE POLICY "anon_update_lich_su_bao_cao"
    ON public.lich_su_bao_cao
    FOR UPDATE
    TO anon
    USING (true)
    WITH CHECK (true);

-- 8. Policy: Anonymous — xóa bản ghi
CREATE POLICY "anon_delete_lich_su_bao_cao"
    ON public.lich_su_bao_cao
    FOR DELETE
    TO anon
    USING (true);

-- 9. Policy: Authenticated — toàn quyền
CREATE POLICY "auth_all_lich_su_bao_cao"
    ON public.lich_su_bao_cao
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 10. Index tìm kiếm theo người tạo và ngày
CREATE INDEX IF NOT EXISTS idx_lich_su_bao_cao_nguoi_tao ON public.lich_su_bao_cao (nguoi_tao);
CREATE INDEX IF NOT EXISTS idx_lich_su_bao_cao_created_at ON public.lich_su_bao_cao (created_at DESC);
