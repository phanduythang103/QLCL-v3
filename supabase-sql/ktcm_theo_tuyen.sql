-- Bảng ktcm_theo_tuyen
CREATE TABLE ktcm_theo_tuyen (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    ngay_bao_cao DATE,
    nguoi_bao_cao TEXT,
    chuyen_khoa_linh_vuc TEXT,
    tong_so_ky_thuat INTEGER,
    so_ky_thuat_da_thuc_hien INTEGER,
    so_ky_thuat_chua_thuc_hien INTEGER,
    ty_le NUMERIC GENERATED ALWAYS AS (
        CASE 
            WHEN tong_so_ky_thuat > 0 THEN ROUND((so_ky_thuat_da_thuc_hien::NUMERIC / tong_so_ky_thuat::NUMERIC) * 100, 2)
            ELSE 0 
        END
    ) STORED,
    nguyen_nhan_chua_trien_khai TEXT,
    ghi_chu TEXT
);

-- Bật Row Level Security (RLS)
ALTER TABLE ktcm_theo_tuyen ENABLE ROW LEVEL SECURITY;

-- Tạo các policy (full quyền)
-- Cho phép xem (SELECT) tất cả các dòng
CREATE POLICY "Cho phép xem tất cả trên ktcm_theo_tuyen" 
    ON ktcm_theo_tuyen 
    FOR SELECT 
    USING (true);

-- Cho phép thêm mới (INSERT)
CREATE POLICY "Cho phép thêm mới trên ktcm_theo_tuyen" 
    ON ktcm_theo_tuyen 
    FOR INSERT 
    WITH CHECK (true);

-- Cho phép cập nhật (UPDATE) tất cả các dòng
CREATE POLICY "Cho phép cập nhật trên ktcm_theo_tuyen" 
    ON ktcm_theo_tuyen 
    FOR UPDATE 
    USING (true);

-- Cho phép xóa (DELETE) tất cả các dòng
CREATE POLICY "Cho phép xóa trên ktcm_theo_tuyen" 
    ON ktcm_theo_tuyen 
    FOR DELETE 
    USING (true);
