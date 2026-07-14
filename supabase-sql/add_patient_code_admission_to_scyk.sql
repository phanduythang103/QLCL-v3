-- Add patient code and admission datetime to medical incident reports
ALTER TABLE public.bao_cao_scyk
  ADD COLUMN IF NOT EXISTS ma_bn text,
  ADD COLUMN IF NOT EXISTS thoi_gian_vao_vien timestamp with time zone;

COMMENT ON COLUMN public.bao_cao_scyk.ma_bn IS 'Mã người bệnh';
COMMENT ON COLUMN public.bao_cao_scyk.thoi_gian_vao_vien IS 'Thời gian vào viện của người bệnh';