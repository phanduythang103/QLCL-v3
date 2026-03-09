-- Bảng danh sách bệnh nhân Viêm phổi bệnh viện (VPBV) / Viêm phổi máy thở (VAP)
CREATE TABLE IF NOT EXISTS danh_sach_vpbv (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ngay_bao_cao DATE NOT NULL DEFAULT CURRENT_DATE,
    ma_ba TEXT, -- Mã bệnh án
    khoa TEXT NOT NULL, -- Khoa điều trị
    ho_ten_nb TEXT NOT NULL,
    gioi_tinh TEXT CHECK (gioi_tinh IN ('Nam', 'Nữ')),
    nam_sinh INTEGER,
    ngay_nhap_vien DATE,
    ngay_khoi_phat_vp DATE,
    chan_doan_nkbv TEXT DEFAULT 'Viêm phổi bệnh viện', -- Phân loại
    chan_doan_xac_dinh TEXT, -- Chẩn đoán chi tiết/xác định
    ket_qua_vsv TEXT, -- Kết quả vi sinh vật
    tinh_trang TEXT DEFAULT 'Đang điều trị', -- Đang điều trị, Ổn định, Tử vong, Chuyển viện
    ngay_may_tho_cong_don INTEGER DEFAULT 0, -- Số ngày máy thở cộng dồn của NB (để tính tỷ lệ)
    ghi_chu TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE danh_sach_vpbv ENABLE ROW LEVEL SECURITY;

-- Allow all operations for public (anon/authenticated)
CREATE POLICY "Allow all operations" ON danh_sach_vpbv
    FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);

-- Index
CREATE INDEX IF NOT EXISTS idx_vpbv_ngay ON danh_sach_vpbv(ngay_bao_cao);
CREATE INDEX IF NOT EXISTS idx_vpbv_khoa ON danh_sach_vpbv(khoa);
