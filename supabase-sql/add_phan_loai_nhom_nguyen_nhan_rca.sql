-- Thêm cột phân loại sự cố theo nhóm nguyên nhân gây ra sự cố (mục III) vào bảng rca_phan_tich_scyk
ALTER TABLE public.rca_phan_tich_scyk
  ADD COLUMN IF NOT EXISTS phan_loai_nhom_nguyen_nhan jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS phan_loai_nhom_nguyen_nhan_khac text;
