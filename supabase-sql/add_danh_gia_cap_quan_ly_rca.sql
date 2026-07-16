-- Thêm các cột mục B - Dành cho cấp quản lý vào bảng rca_phan_tich_scyk
ALTER TABLE public.rca_phan_tich_scyk
  ADD COLUMN IF NOT EXISTS mo_ta_ket_qua_phat_hien text,
  ADD COLUMN IF NOT EXISTS da_thao_luan_khuyen_cao text,
  ADD COLUMN IF NOT EXISTS phu_hop_khuyen_cao_chinh_thuc text,
  ADD COLUMN IF NOT EXISTS khuyen_cao_ap_dung text,
  ADD COLUMN IF NOT EXISTS muc_do_ton_thuong_nguoi_benh text,
  ADD COLUMN IF NOT EXISTS ton_thuong_to_chuc jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS ton_thuong_to_chuc_khac text;
