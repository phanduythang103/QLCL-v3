-- Add detailed fields to cau_hinh_cscl table
ALTER TABLE cau_hinh_cscl
ADD COLUMN IF NOT EXISTS dinh_nghia TEXT,
ADD COLUMN IF NOT EXISTS khia_canh_cl TEXT,
ADD COLUMN IF NOT EXISTS thanh_to_cl TEXT,
ADD COLUMN IF NOT EXISTS ly_do_lua_chon TEXT,
ADD COLUMN IF NOT EXISTS cong_thuc TEXT,
ADD COLUMN IF NOT EXISTS tu_so TEXT,
ADD COLUMN IF NOT EXISTS mau_so TEXT,
ADD COLUMN IF NOT EXISTS tieu_chuan_lua_chon TEXT,
ADD COLUMN IF NOT EXISTS tieu_chuan_loai_tru TEXT,
ADD COLUMN IF NOT EXISTS nguon_so_lieu TEXT,
ADD COLUMN IF NOT EXISTS phuong_phap_thu_thap TEXT,
ADD COLUMN IF NOT EXISTS tan_suat_bao_cao TEXT,
ADD COLUMN IF NOT EXISTS trach_nhiem TEXT;

COMMENT ON COLUMN cau_hinh_cscl.dinh_nghia IS '1. Định nghĩa';
COMMENT ON COLUMN cau_hinh_cscl.khia_canh_cl IS '3. Khía cạnh chất lượng';
COMMENT ON COLUMN cau_hinh_cscl.thanh_to_cl IS '3. Thành tố chất lượng';
COMMENT ON COLUMN cau_hinh_cscl.ly_do_lua_chon IS '4. Lý do lựa chọn';
COMMENT ON COLUMN cau_hinh_cscl.cong_thuc IS '5. Công thức tính';
COMMENT ON COLUMN cau_hinh_cscl.tu_so IS '5. Tử số';
COMMENT ON COLUMN cau_hinh_cscl.mau_so IS '5. Mẫu số';
COMMENT ON COLUMN cau_hinh_cscl.tieu_chuan_lua_chon IS '5. Tiêu chuẩn lựa chọn';
COMMENT ON COLUMN cau_hinh_cscl.tieu_chuan_loai_tru IS '5. Tiêu chuẩn loại trừ';
COMMENT ON COLUMN cau_hinh_cscl.nguon_so_lieu IS '6. Nguồn số liệu';
COMMENT ON COLUMN cau_hinh_cscl.phuong_phap_thu_thap IS '6. Phương pháp thu thập';
COMMENT ON COLUMN cau_hinh_cscl.tan_suat_bao_cao IS '7. Tần suất báo cáo';
COMMENT ON COLUMN cau_hinh_cscl.trach_nhiem IS '8. Trách nhiệm';
