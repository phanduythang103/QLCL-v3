-- Table: public.giam_sat_5s
-- Description: Giám sát 5S (Sàng lọc - Sắp xếp - Sạch sẽ - Săn sóc - Sẵn sàng)

CREATE TABLE IF NOT EXISTS public.giam_sat_5s (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,

    -- Thông tin chung
    ngay_giam_sat DATE NOT NULL,
    nguoi_giam_sat TEXT NOT NULL,
    don_vi_duoc_giam_sat TEXT NOT NULL,
    khu_vuc_giam_sat TEXT,

    -- I. SÀNG LỌC (SERI) - Tối đa 30 điểm
    -- TC1: Loại bỏ vật dụng không cần thiết (max 10)
    tc1_diem INTEGER DEFAULT 10 CHECK (tc1_diem BETWEEN 0 AND 10),
    tc1_ghi_chu TEXT,
    tc1_hinh_anh TEXT[] DEFAULT '{}',

    -- TC2: Không có rác thải, tài liệu cũ lỗi thời (max 10)
    tc2_diem INTEGER DEFAULT 10 CHECK (tc2_diem BETWEEN 0 AND 10),
    tc2_ghi_chu TEXT,
    tc2_hinh_anh TEXT[] DEFAULT '{}',

    -- TC3: Không có thuốc, vật tư hết hạn (max 10)
    tc3_diem INTEGER DEFAULT 10 CHECK (tc3_diem BETWEEN 0 AND 10),
    tc3_ghi_chu TEXT,
    tc3_hinh_anh TEXT[] DEFAULT '{}',

    -- II. SẮP XẾP (SEITON) - Tối đa 20 điểm
    -- TC4: Mọi thứ có vị trí cố định, có nhãn tên (max 5)
    tc4_diem INTEGER DEFAULT 5 CHECK (tc4_diem BETWEEN 0 AND 5),
    tc4_ghi_chu TEXT,
    tc4_hinh_anh TEXT[] DEFAULT '{}',

    -- TC5: Có nhãn tên, vạch kẻ ranh giới hoặc mã màu (max 5)
    tc5_diem INTEGER DEFAULT 5 CHECK (tc5_diem BETWEEN 0 AND 5),
    tc5_ghi_chu TEXT,
    tc5_hinh_anh TEXT[] DEFAULT '{}',

    -- TC6: Nguyên tắc Dễ thấy - Dễ lấy - Dễ kiểm tra (max 5)
    tc6_diem INTEGER DEFAULT 5 CHECK (tc6_diem BETWEEN 0 AND 5),
    tc6_ghi_chu TEXT,
    tc6_hinh_anh TEXT[] DEFAULT '{}',

    -- TC7: Phương tiện cấp cứu ở vị trí quy định (max 5)
    tc7_diem INTEGER DEFAULT 5 CHECK (tc7_diem BETWEEN 0 AND 5),
    tc7_ghi_chu TEXT,
    tc7_hinh_anh TEXT[] DEFAULT '{}',

    -- III. SẠCH SẼ (SEISO) - Tối đa 20 điểm
    -- TC8: Sàn nhà, tường, thiết bị sạch (max 10)
    tc8_diem INTEGER DEFAULT 10 CHECK (tc8_diem BETWEEN 0 AND 10),
    tc8_ghi_chu TEXT,
    tc8_hinh_anh TEXT[] DEFAULT '{}',

    -- TC9: Thùng rác sạch, có nắp, phân loại đúng (max 10)
    tc9_diem INTEGER DEFAULT 10 CHECK (tc9_diem BETWEEN 0 AND 10),
    tc9_ghi_chu TEXT,
    tc9_hinh_anh TEXT[] DEFAULT '{}',

    -- IV. SĂN SÓC (SEIKETSU) - Tối đa 20 điểm
    -- TC10: Duy trì nề nếp, phân công trách nhiệm (max 5)
    tc10_diem INTEGER DEFAULT 5 CHECK (tc10_diem BETWEEN 0 AND 5),
    tc10_ghi_chu TEXT,
    tc10_hinh_anh TEXT[] DEFAULT '{}',

    -- TC11: Có hình ảnh Trước và Sau (max 5)
    tc11_diem INTEGER DEFAULT 5 CHECK (tc11_diem BETWEEN 0 AND 5),
    tc11_ghi_chu TEXT,
    tc11_hinh_anh TEXT[] DEFAULT '{}',

    -- TC12: Biển báo, sơ đồ, bảng phân công được cập nhật (max 5)
    tc12_diem INTEGER DEFAULT 5 CHECK (tc12_diem BETWEEN 0 AND 5),
    tc12_ghi_chu TEXT,
    tc12_hinh_anh TEXT[] DEFAULT '{}',

    -- TC13: Trang phục nhân viên y tế chỉnh tề (max 5)
    tc13_diem INTEGER DEFAULT 5 CHECK (tc13_diem BETWEEN 0 AND 5),
    tc13_ghi_chu TEXT,
    tc13_hinh_anh TEXT[] DEFAULT '{}',

    -- V. SẴN SÀNG (SHITSUKE) - Tối đa 10 điểm
    -- TC14: Nhân viên hiểu ý nghĩa 5S (max 5)
    tc14_diem INTEGER DEFAULT 5 CHECK (tc14_diem BETWEEN 0 AND 5),
    tc14_ghi_chu TEXT,
    tc14_hinh_anh TEXT[] DEFAULT '{}',

    -- TC15: Có biên bản họp đánh giá kết quả 5S (max 5)
    tc15_diem INTEGER DEFAULT 5 CHECK (tc15_diem BETWEEN 0 AND 5),
    tc15_ghi_chu TEXT,
    tc15_hinh_anh TEXT[] DEFAULT '{}',

    -- Kết quả tổng hợp
    tong_diem INTEGER DEFAULT 100,           -- Tổng điểm thực tế (max 100)
    phan_loai TEXT DEFAULT 'Xuất sắc',       -- Xuất sắc / Tốt / Trung bình / Yếu
    ghi_chu_chung TEXT
);

-- 2. Enable RLS
ALTER TABLE public.giam_sat_5s ENABLE ROW LEVEL SECURITY;

-- 3. Policies
DROP POLICY IF EXISTS "Allow all users to read giam_sat_5s" ON public.giam_sat_5s;
CREATE POLICY "Allow all users to read giam_sat_5s" ON public.giam_sat_5s FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Allow all users to insert giam_sat_5s" ON public.giam_sat_5s;
CREATE POLICY "Allow all users to insert giam_sat_5s" ON public.giam_sat_5s FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all users to update giam_sat_5s" ON public.giam_sat_5s;
CREATE POLICY "Allow all users to update giam_sat_5s" ON public.giam_sat_5s FOR UPDATE TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all users to delete giam_sat_5s" ON public.giam_sat_5s;
CREATE POLICY "Allow all users to delete giam_sat_5s" ON public.giam_sat_5s FOR DELETE TO public USING (true);

-- 4. Trigger for updated_at (reuse existing function if available)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_giam_sat_5s_updated_at ON public.giam_sat_5s;
CREATE TRIGGER update_giam_sat_5s_updated_at
    BEFORE UPDATE ON public.giam_sat_5s
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 5. Storage bucket policy (run if bucket 'giam_sat' does not exist yet)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('giam_sat', 'giam_sat', true) ON CONFLICT (id) DO NOTHING;
