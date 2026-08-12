-- Kịch bản cập nhật cấu trúc bảng gs_ndnb (Tiêu chuẩn JCI - IPSG.01.00)
-- Thêm 2 cột: ho_ten_nguoi_benh và thoi_diem_dinh_danh
-- Chạy script này trên giao diện SQL Editor của Supabase

ALTER TABLE gs_ndnb
ADD COLUMN IF NOT EXISTS ho_ten_nguoi_benh VARCHAR(255),
ADD COLUMN IF NOT EXISTS thoi_diem_dinh_danh VARCHAR(255);
