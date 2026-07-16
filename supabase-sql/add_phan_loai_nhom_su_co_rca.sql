-- Thêm cột phân loại sự cố theo nhóm sự cố (mục II) vào bảng rca_phan_tich_scyk
ALTER TABLE public.rca_phan_tich_scyk
  ADD COLUMN IF NOT EXISTS phan_loai_nhom_su_co jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS phan_loai_nhom_su_co_khac text;
