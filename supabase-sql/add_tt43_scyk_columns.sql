-- Migration to add columns required for TT 43/2018/TT-BYT SCYK form
ALTER TABLE bao_cao_scyk 
ADD COLUMN IF NOT EXISTS so_benh_an TEXT,
ADD COLUMN IF NOT EXISTS ngay_sinh DATE,
ADD COLUMN IF NOT EXISTS gioi TEXT,
ADD COLUMN IF NOT EXISTS vi_tri_cu_the TEXT,
ADD COLUMN IF NOT EXISTS thong_bao_bs_dieu_tri TEXT DEFAULT 'Không ghi nhận',
ADD COLUMN IF NOT EXISTS thong_bao_nguoi_nha TEXT DEFAULT 'Không ghi nhận',
ADD COLUMN IF NOT EXISTS thong_bao_nguoi_benh TEXT DEFAULT 'Không ghi nhận',
ADD COLUMN IF NOT EXISTS ghi_nhan_vao_hsba TEXT DEFAULT 'Không ghi nhận',
ADD COLUMN IF NOT EXISTS nguoi_bao_cao_sdt TEXT,
ADD COLUMN IF NOT EXISTS nguoi_bao_cao_email TEXT,
ADD COLUMN IF NOT EXISTS nguoi_bao_cao_doi_tuong TEXT,
ADD COLUMN IF NOT EXISTS nguoi_bao_cao_chuc_danh_khac TEXT,
ADD COLUMN IF NOT EXISTS muc_do_anh_huong TEXT;
