-- Thêm cột "6. Mô tả hành động xử lý sự cố" (mục I) vào bảng rca_phan_tich_scyk
ALTER TABLE public.rca_phan_tich_scyk
  ADD COLUMN IF NOT EXISTS mo_ta_hanh_dong_xu_ly_su_co text;
